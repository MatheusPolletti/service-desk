import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDTO } from './dto/create.ticket.dto';
import { AddTicketMessageDTO } from './dto/add.ticket.message.dto';
import { UpdateTicketStatusDTO } from './dto/update.ticket.status.dto';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Patch('status/:id')
  async updateStatus(
    @Param('id', ParseIntPipe) ticketId: number,
    @Body() dto: UpdateTicketStatusDTO,
  ) {
    return this.ticketService.updateStatus(ticketId, dto.status);
  }

  @Post('create')
  async createTicket(@Body() createTicketDTO: CreateTicketDTO) {
    return this.ticketService.createTicket(createTicketDTO);
  }

  @Post('add/message/:id')
  async addMessage(
    @Param('id', ParseIntPipe) ticketId: number,
    @Body() dto: AddTicketMessageDTO,
  ) {
    return this.ticketService.addMessage(ticketId, dto);
  }

  @Get('get/messages')
  async getMessages() {
    return this.ticketService.getMessages();
  }

  @Get('get/message/:id')
  async GetMessageId(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.getMessagesId(id);
  }
}
