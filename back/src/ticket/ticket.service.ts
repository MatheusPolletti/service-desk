import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { EmailService } from 'src/email/email.service';
import { CreateTicketDTO } from './dto/create.ticket.dto';
import { randomUUID } from 'crypto';
import { AddTicketMessageDTO } from './dto/add.ticket.message.dto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class TicketService {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  async getDashboardStats() {
    const statusCounts = await this.prisma.ticket.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const resolvedToday = await this.prisma.ticket.count({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        updatedAt: {
          gte: startOfToday,
        },
      },
    });

    const openCount =
      statusCounts.find((s) => s.status === 'OPEN')?._count.id || 0;
    const pendingCount =
      statusCounts.find((s) => s.status === 'PENDING')?._count.id || 0;

    return {
      open: openCount,
      pending: pendingCount,
      resolvedToday: resolvedToday,
    };
  }

  async updateStatus(ticketId: number, status: TicketStatus) {
    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: status,
        updatedAt: new Date(),
      },
    });
    return ticket;
  }

  async getMessages() {
    try {
      const data = await this.prisma.ticket.findMany({
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return {
        data,
        success: true,
      };
    } catch {
      return {
        success: false,
      };
    }
  }

  async getMessagesId(id: number) {
    try {
      const data = await this.prisma.ticket.findUnique({
        where: { id },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              attachments: true,
            },
          },
        },
      });

      return {
        data,
        success: true,
      };
    } catch {
      return {
        success: false,
      };
    }
  }

  async createTicket(dto: CreateTicketDTO) {
    const rootMessageId = `<ticket-${randomUUID()}@proit.com.br>`;
    const email = 'matheus.c.polletti@gmail.com';

    const ticket = await this.prisma.ticket.create({
      data: {
        subject: dto.subject,
        requesterEmail: dto.recipients,
        recipients: [email],
        originalMessageId: rootMessageId,
        messages: {
          create: {
            content: dto.content,
            direction: 'OUT',
            messageId: rootMessageId,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    const contentHtml = dto.content
      .replace(/\n/g, '<br>')
      .replace(/ {2}/g, ' &nbsp;');

    await this.emailService.sendTicketEmail({
      from: email,
      to: [dto.recipients],
      ticketId: ticket.id,
      ticketSubject: ticket.subject,
      currentMessageId: rootMessageId,
      inReplyTo: rootMessageId,
      references: rootMessageId,
      content: contentHtml,
    });

    return ticket;
  }

  async addMessage(ticketId: number, dto: AddTicketMessageDTO) {
    console.log('oi');
    console.log(ticketId);
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    console.log(ticket);

    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    const newMessageId = `<reply-${randomUUID()}@proit.com.br>`;

    console.log(newMessageId);

    let parentMessage: {
      messageId: string;
      references: string | null;
    } | null = null;

    if (dto.parentMessageId) {
      parentMessage = await this.prisma.message.findUnique({
        where: { id: dto.parentMessageId },
        select: { messageId: true, references: true },
      });
    }

    if (!parentMessage) {
      const lastMsg = ticket.messages[0];
      if (lastMsg) {
        parentMessage = {
          messageId: lastMsg.messageId,
          references: lastMsg.references,
        };
      } else {
        parentMessage = {
          messageId: ticket.originalMessageId,
          references: null,
        };
      }
    }

    const parentMessageIdHeader = parentMessage.messageId;

    let referencesHeader = '';

    const parentRefs = parentMessage.references
      ? parentMessage.references.trim()
      : '';
    const parentMsgId = parentMessage.messageId.trim();

    if (parentRefs) {
      referencesHeader = `${parentRefs} ${parentMsgId}`;
    } else {
      if (parentMsgId === ticket.originalMessageId) {
        referencesHeader = ticket.originalMessageId;
      } else {
        referencesHeader = `${ticket.originalMessageId} ${parentMsgId}`;
      }
    }

    const uniqueRefs = [...new Set(referencesHeader.split(/\s+/))].filter(
      Boolean,
    );
    referencesHeader = uniqueRefs.join(' ');
    const existingRecipients = ticket.recipients || [];
    const newRecipients = dto.recipients || [];
    const uniqueRecipients = [
      ...new Set([...existingRecipients, ...newRecipients]),
    ];
    const finalRecipientsList = uniqueRecipients.filter(
      (email) => email !== ticket.requesterEmail,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content: dto.content,
          direction: 'OUT',
          messageId: newMessageId,
          references: referencesHeader,
          ticketId: ticket.id,
        },
      });

      console.log(message);

      await tx.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          status: 'PENDING',
          slaDueDate: null,
          slaStatus: 'OK',
          updatedAt: new Date(),
          recipients: finalRecipientsList,
        },
      });

      return message;
    });

    console.log(result);

    if (dto.notifyClient) {
      const emailSubject = `[Ticket #${ticket.id}] ${ticket.subject}`;
      const sendTo = [ticket.requesterEmail, ...finalRecipientsList];

      console.log({
        from: 'matheus.c.polletti@gmail.com',
        to: sendTo,
        ticketId: ticket.id,
        currentMessageId: newMessageId,
        inReplyTo: parentMessageIdHeader,
        references: referencesHeader,
        content: dto.content,
        ticketSubject: emailSubject,
      });

      await this.emailService.sendTicketEmail({
        from: 'matheus.c.polletti@gmail.com',
        to: sendTo,
        ticketId: ticket.id,
        currentMessageId: newMessageId,
        inReplyTo: parentMessageIdHeader,
        references: referencesHeader,
        content: dto.content,
        ticketSubject: emailSubject,
      });
    }

    return result;
  }
}
