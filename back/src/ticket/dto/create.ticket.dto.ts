import { IsEmail, IsString } from 'class-validator';

export class CreateTicketDTO {
  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsEmail()
  requesterEmail: string;

  @IsEmail({}, { each: true })
  recipients: string[];
}
