import { TicketStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class AddTicketMessageDTO {
  @IsString()
  content: string;

  @IsBoolean()
  notifyClient: boolean;

  @IsEmail({}, { each: true })
  recipients: string[];

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsString()
  parentMessageId?: string;
}
