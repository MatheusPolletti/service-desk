import { IsEmail, IsString } from 'class-validator';

export class CreateTicketDTO {
  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsEmail()
  recipients: string;
}
