import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';
import { GetConversationsDto } from './../conversations/dto/get-conversations.dto';

@Controller('messages/conversations')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post(':id')
  createMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.createMessage(createMessageDto);
  }

  @Get(':param')
  getMessages(@Query() query: GetConversationsDto) {
    return this.messagesService.getMessages(query);
  }
}
