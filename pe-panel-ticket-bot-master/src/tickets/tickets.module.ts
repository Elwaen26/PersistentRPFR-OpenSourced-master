import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TranscriptsModule } from '../transcripts/transcripts.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  providers: [TicketsService],
  imports: [TranscriptsModule, RedisModule],
})
export class TicketsModule {}
