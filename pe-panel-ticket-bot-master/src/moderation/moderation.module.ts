import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [ModerationService],
})
export class ModerationModule {}
