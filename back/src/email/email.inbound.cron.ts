import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailInboundService } from './email.inbound.service';

@Injectable()
export class EmailInboundCron {
  constructor(private readonly inbound: EmailInboundService) {}

  @Cron('*/10 * * * * *')
  async handleCron() {
    await this.inbound.checkInbox();
  }
}
