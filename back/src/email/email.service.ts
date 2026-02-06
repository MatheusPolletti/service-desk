import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendTicketEmail(params: {
    from: string;
    to: string[];
    ticketId: number;
    ticketSubject: string;
    content: string;
    currentMessageId: string;
    references: string;
  }) {
    const {
      from,
      to,
      ticketId,
      ticketSubject,
      content,
      currentMessageId,
      references,
    } = params;

    await this.mailerService.sendMail({
      from,
      to,
      subject: `[Ticket #${ticketId}] ${ticketSubject}`,
      html: `<p>${content}</p>`,
      text: content,
      headers: {
        'Message-ID': currentMessageId,
        'In-Reply-To': references,
        References: references,
      },
    });
  }
}
