import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { EmailService } from 'src/email/email.service';
import { CreateTicketDTO } from './dto/create.ticket.dto';
import { randomUUID } from 'crypto';
import { AddTicketMessageDTO } from './dto/add.ticket.message.dto';

@Injectable()
export class TicketService {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

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
      where: { id: ticketId },
    });

    console.log(ticket);

    if (!ticket) {
      throw new NotFoundException(`Ticket com ID ${ticketId} não encontrado.`);
    }

    const newMessageId = `<reply-${randomUUID()}@proit.com.br>`;

    const message = await this.prisma.message.create({
      data: {
        content: dto.content,
        direction: 'OUT',
        messageId: newMessageId,
        ticketId: ticket.id,
      },
    });

    if (dto.notifyClient) {
      const contentHtml = dto.content
        .replace(/\n/g, '<br>')
        .replace(/ {2}/g, ' &nbsp;');

      await this.emailService.sendTicketEmail({
        from: 'matheus.c.polletti@gmail.com',
        to: dto.recipients,
        ticketId: ticket.id,
        currentMessageId: newMessageId,
        references: ticket.originalMessageId,
        content: contentHtml,
        ticketSubject: ticket.subject,
      });
    }

    return message;
  }
}
