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
    inReplyTo?: string;
    references: string;
  }) {
    const {
      from,
      to,
      ticketId,
      ticketSubject,
      content,
      currentMessageId,
      inReplyTo,
      references,
    } = params;

    const tag = `[Ticket #${ticketId}]`;

    const finalSubject = ticketSubject.includes(tag)
      ? ticketSubject
      : `${tag} ${ticketSubject}`;

    const headers: Record<string, string> = {
      'Message-ID': currentMessageId,
      References: references,
    };

    if (inReplyTo) {
      headers['In-Reply-To'] = inReplyTo;
    }

    await this.mailerService.sendMail({
      from,
      to,
      subject: finalSubject,
      html: `<p>${content.replace(/\n/g, '<br>')}</p>`,
      text: content,
      headers: headers,
    });
  }
}
