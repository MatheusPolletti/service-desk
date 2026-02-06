import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { EmailModule } from 'src/email/email.module';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [EmailModule],
  controllers: [TicketController],
  providers: [TicketService, PrismaService],
})
export class TicketModule {}
