import { Body, Controller, Post } from '@nestjs/common';
import { CreateModlogMessageDto } from './dto/events.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('modlog')
  async createModlogMessage(@Body() createModlogDto: CreateModlogMessageDto) {
    return await this.eventsService.createModlogMessage(createModlogDto);
  }
}
