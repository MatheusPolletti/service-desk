import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailInboundCron } from './email.inbound.cron';
import { EmailInboundService } from './email.inbound.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('EMAIL_HOST'),
          port: Number(config.get<string>('EMAIL_PORT')),
          secure: true,
          auth: {
            user: config.get<string>('EMAIL_USER'),
            pass: config.get<string>('EMAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"Sistema" <${config.get('EMAIL_USER')}>`,
        },
      }),
    }),
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailInboundCron,
    EmailInboundService,
    PrismaService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
