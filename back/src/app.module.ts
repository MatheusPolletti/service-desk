import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [EmailModule, TicketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
