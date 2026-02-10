import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class SlaCron {
  private readonly logger = new Logger(SlaCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkSlaBreaches() {
    const now = new Date();

    const breachedTickets = await this.prisma.ticket.updateMany({
      where: {
        slaDueDate: { lt: now },
        slaStatus: { not: 'BREACHED' },
        status: { in: ['OPEN'] },
      },
      data: {
        slaStatus: 'BREACHED',
      },
    });

    if (breachedTickets.count > 0) {
      this.logger.warn(
        `${breachedTickets.count} tickets estouraram o SLA de 4h!`,
      );
    }
  }
}
