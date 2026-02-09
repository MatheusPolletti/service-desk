import { Injectable, Logger } from '@nestjs/common';
import * as imaps from 'imap-simple';
import type { ParsedMail } from 'mailparser';
import { simpleParser } from 'mailparser';
import { PrismaService } from 'prisma/prisma.service';
import { ImapConfig } from './interface/imap-config';
import { ImapConnection } from './interface/imap-connection';
import { ImapMessage } from './interface/imap-message';
import { AttachmentData } from './interface/attachment-data';

@Injectable()
export class EmailInboundService {
  private readonly logger = new Logger(EmailInboundService.name);

  constructor(private readonly prisma: PrismaService) {}

  private cleanEmailContent(text: string): string {
    if (!text) return '';

    const separators = [
      /_{30,}/,
      /De:\s.*<.+@.+>/i,
      /From:\s.*<.+@.+>/i,
      /Em\s.*escreveu:/i,
      /On\s.*wrote:/i,
      /-{5,}Original Message-{5,}/i,
    ];

    const lines = text.split('\n');
    const outputLines: string[] = [];

    for (const line of lines) {
      const isSeparator = separators.some((regex) => regex.test(line));
      if (isSeparator) break;

      outputLines.push(line);
    }

    const cleanText = outputLines.join('\n');

    return cleanText.trim();
  }

  private extractAttachments(email: ParsedMail): AttachmentData[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const attachments = (email.attachments as any) ?? [];
    return Array.isArray(attachments)
      ? attachments.map((att: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          filename: (att.filename as string) || 'arquivo',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          mimeType: (att.contentType as string) || 'application/octet-stream',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          data: (att.content as Buffer).toString('base64'),
        }))
      : [];
  }

  async checkInbox(): Promise<void> {
    const config: ImapConfig = {
      imap: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.IMAP_HOST,
        port: Number(process.env.IMAP_PORT),
        tls: true,
        tlsOptions: {
          rejectUnauthorized: false,
        },
        authTimeout: 5000,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const connection = (await imaps.connect(
      config,
    )) as unknown as ImapConnection;
    await connection.openBox('INBOX');

    const messages = (await connection.search(['UNSEEN'], {
      bodies: [''],
      markSeen: true,
    })) as unknown as ImapMessage[];

    for (const item of messages) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const parsed = await simpleParser(
        typeof item.parts[0].body === 'string'
          ? item.parts[0].body
          : item.parts[0].body.toString(),
      );
      await this.processEmail(parsed);
    }

    await connection.end();
  }

  private async processEmail(email: ParsedMail): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const messageId = email.messageId as string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const inReplyTo = email.inReplyTo as string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const subject = (email.subject as string | undefined) || '(Sem Assunto)';

    let references: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (email.references) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const refs = email.references as string | string[];
      references = Array.isArray(refs) ? refs : [refs];
    }

    if (!messageId) return;

    let ticketId: number | null = null;

    if (inReplyTo) {
      const parentMessage = await this.prisma.message.findUnique({
        where: { messageId: inReplyTo },
        select: { ticketId: true },
      });
      if (parentMessage) ticketId = parentMessage.ticketId;
    }

    if (!ticketId && references.length > 0) {
      const relatedMessage = await this.prisma.message.findFirst({
        where: { messageId: { in: references } },
        select: { ticketId: true },
      });
      if (relatedMessage) ticketId = relatedMessage.ticketId;
    }

    if (!ticketId) {
      const match = subject.match(/\[Ticket #(\d+)\]/i);
      if (match?.[1]) {
        const possibleId = parseInt(match[1], 10);
        const ticketExists = await this.prisma.ticket.findUnique({
          where: { id: possibleId },
        });
        if (ticketExists) ticketId = possibleId;
      }
    }

    if (ticketId) {
      await this.addReplyToTicket(ticketId, email, messageId);
      this.logger.log(`Resposta processada para o Ticket #${ticketId}`);
    } else {
      await this.createNewTicket(email, messageId);
      this.logger.log(`Novo Ticket criado a partir do e-mail: ${subject}`);
    }
  }

  private async createNewTicket(
    email: ParsedMail,
    messageId: string,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const sender = (email.from as any)?.value?.[0]?.address as
      | string
      | undefined;

    const rawContent =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (email.text as string | undefined) ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (email.html as string | undefined) ||
      '';
    const cleanContent = this.cleanEmailContent(rawContent);

    const extractEmails = (field: any): string[] => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!field || !field.value) return [];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return (field.value as Array<{ address: string }>).map((v) => v.address);
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const toAddresses = extractEmails((email.to as any) ?? null);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const ccAddresses = extractEmails((email.cc as any) ?? null);

    const allRecipients = [...new Set([...toAddresses, ...ccAddresses])];

    const systemEmail = process.env.EMAIL_USER;

    const validRecipients = allRecipients.filter(
      (addr) => addr !== sender && addr !== systemEmail,
    );

    const attachmentsData = this.extractAttachments(email);

    await this.prisma.ticket.create({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        subject: email.subject,
        requesterEmail: sender || 'unknown@example.com',
        recipients: validRecipients,
        originalMessageId: messageId,
        status: 'OPEN',
        messages: {
          create: {
            content: cleanContent,
            direction: 'IN',
            messageId: messageId,
            attachments: {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              create: attachmentsData as any,
            },
          },
        },
      },
    });
  }

  private async addReplyToTicket(
    ticketId: number,
    email: ParsedMail,
    messageId: string,
  ): Promise<void> {
    const exists = await this.prisma.message.findUnique({
      where: { messageId },
    });
    if (exists) return;

    const rawContent =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (email.text as string | undefined) ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (email.html as string | undefined) ||
      '';
    const cleanContent = this.cleanEmailContent(rawContent);
    const attachmentsData = this.extractAttachments(email);

    await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          content: cleanContent,
          direction: 'IN',
          messageId: messageId,
          ticketId: ticketId,
          attachments: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            create: attachmentsData as any,
          },
        },
      }),
      this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          updatedAt: new Date(),
          status: 'OPEN',
        },
      }),
    ]);
  }
}
