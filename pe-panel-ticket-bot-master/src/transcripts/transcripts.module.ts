import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { join } from 'path';
import { TranscriptsService } from './transcripts.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  providers: [TranscriptsService],
  exports: [TranscriptsService],
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: process.env.TRANSCRIPTS_QUEUE,
      processors: [join(__dirname, 'transcripts.consumer.js')],
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
    RedisModule,
  ],
})
export class TranscriptsModule {}
