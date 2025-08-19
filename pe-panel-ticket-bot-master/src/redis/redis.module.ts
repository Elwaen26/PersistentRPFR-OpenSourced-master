import { Global, Module } from '@nestjs/common';
import { Redis } from 'ioredis';

@Module({
  providers: [
    {
      provide: 'REDIS_TOKEN',
      useFactory: () => {
        const client = new Redis();
        return client;
      },
    },
  ],
  exports: ['REDIS_TOKEN'],
})
export class RedisModule {}
