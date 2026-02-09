import { IsEnum, IsNotEmpty } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketStatusDTO {
  @IsNotEmpty()
  //eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
