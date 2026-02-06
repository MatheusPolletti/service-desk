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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          host: config.get<string>('EMAIL_HOST'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          port: Number(config.get<string>('EMAIL_PORT')),
          secure: true,
          auth: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            user: config.get<string>('EMAIL_USER'),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            pass: config.get<string>('EMAIL_PASSWORD'),
          },
        },
        defaults: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
