import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class EmailInboundService {
  private readonly logger = new Logger(EmailInboundService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkInbox() {
    const config = {
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

    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    const messages = await connection.search(['UNSEEN'], {
      bodies: [''],
      markSeen: true,
    });

    for (const item of messages) {
      const parsed = await simpleParser(item.parts[0].body);

      await this.processEmail(parsed);
    }

    await connection.end();
  }

  private async processEmail(email: any) {
    const messageId = email.messageId;
    const inReplyTo = email.inReplyTo;
    const references: string[] = Array.isArray(email.references)
      ? email.references
      : email.references
        ? [email.references]
        : [];

    if (!messageId) return;

    let message: Prisma.MessageGetPayload<{
      include: {
        ticket: true;
      };
    }> | null = null;

    console.log(message);

    if (inReplyTo) {
      message = await this.prisma.message.findUnique({
        where: {
          messageId: inReplyTo,
        },
        include: {
          ticket: true,
        },
      });
    }

    if (!message && references.length > 0) {
      message = await this.prisma.message.findFirst({
        where: {
          messageId: {
            in: references,
          },
        },
        include: {
          ticket: true,
        },
      });
    }

    if (!message || !message.ticket) {
      return;
    }

    const ticket = message.ticket;
    const rawContent: string =
      email.text || email.html || '(Mensagem sem conteúdo)';

    const cleanContent = this.cleanEmailContent(rawContent);

    const attachmentsData = email.attachments
      ? email.attachments.map((att) => ({
          filename: att.filename || 'image.png',
          mimeType: att.contentType,
          data: att.content.toString('base64'),
        }))
      : [];

    await this.prisma.message.upsert({
      where: { messageId },
      update: {},
      create: {
        content: cleanContent,
        direction: 'IN',
        messageId,
        ticketId: ticket.id,
        attachments: {
          create: attachmentsData,
        },
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { updatedAt: new Date() },
    });
  }

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

    let cleanText = outputLines.join('\n');

    cleanText = cleanText.replace(/\[cid:[^\]]*\]/g, '');

    return cleanText.trim();
  }
}
