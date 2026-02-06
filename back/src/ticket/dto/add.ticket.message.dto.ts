import { IsBoolean, IsEmail, IsString } from 'class-validator';

export class AddTicketMessageDTO {
  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsBoolean()
  notifyClient: boolean;

  @IsEmail({}, { each: true })
  recipients: string[];
}
