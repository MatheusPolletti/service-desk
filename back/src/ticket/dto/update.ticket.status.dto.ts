import { IsEnum, IsNotEmpty } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketStatusDTO {
  @IsNotEmpty()
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
