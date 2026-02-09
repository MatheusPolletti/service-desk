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

  async updateStatus(ticketId: number, status: TicketStatus) {
    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

    const ticket = await this.prisma.ticket.create({
      data: {
        subject: dto.subject,
        requesterEmail: dto.requesterEmail,
        recipients: Array.isArray(dto.recipients)
          ? dto.recipients
          : [dto.recipients],
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
      from: dto.requesterEmail,
      to: dto.recipients,
      ticketId: ticket.id,
      ticketSubject: ticket.subject,
      currentMessageId: rootMessageId,
      references: rootMessageId,
      content: contentHtml,
    });

    return ticket;
  }

  async addMessage(ticketId: number, dto: AddTicketMessageDTO) {
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

    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    const newMessageId = `<reply-${randomUUID()}@seudominio.com.br>`;
    const lastMessageId =
      ticket.messages[0]?.messageId || ticket.originalMessageId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let newStatus = ticket.status;

    if (dto.status) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      newStatus = dto.status;
    } else if (dto.notifyClient && ticket.status === 'OPEN') {
      newStatus = 'PENDING';
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content: dto.content,
          direction: 'OUT',
          messageId: newMessageId,
          ticketId: ticket.id,
        },
      });

      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      return message;
    });

    if (dto.notifyClient) {
      const emailSubject = `[Ticket #${ticket.id}] ${ticket.subject}`;

      await this.emailService.sendTicketEmail({
        from: ticket.requesterEmail,
        to: [ticket.requesterEmail, ...(dto.recipients || [])],
        ticketId: ticket.id,
        currentMessageId: newMessageId,
        references: `${ticket.originalMessageId} ${lastMessageId}`,
        content: dto.content,
        ticketSubject: emailSubject,
      });
    }

    return result;
    // const message = await this.prisma.message.create({
    //   data: {
    //     content: dto.content,
    //     direction: 'OUT',
    //     messageId: newMessageId,
    //     ticketId: ticket.id,
    //   },
    // });

    // if (dto.notifyClient) {
    //   const emailSubject = `[Ticket #${ticket.id}] ${ticket.subject}`;

    //   await this.emailService.sendTicketEmail({
    //     from: ticket.requesterEmail,
    //     to: [ticket.requesterEmail],
    //     ticketId: ticket.id,
    //     currentMessageId: newMessageId,
    //     references: `${ticket.originalMessageId} ${lastMessageId}`,
    //     content: dto.content,
    //     ticketSubject: emailSubject,
    //   });
    // }

    // return message;
  }
}
