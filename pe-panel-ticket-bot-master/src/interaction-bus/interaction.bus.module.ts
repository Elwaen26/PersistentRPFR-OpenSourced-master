import { Global, Module } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InteractionBus } from './interaction.bus';

@Module({
  providers: [InteractionBus],
  exports: [InteractionBus],
})
export class InteractionBusModule {}
