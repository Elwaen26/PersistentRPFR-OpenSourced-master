import { Module } from '@nestjs/common';
import { WhitelistController } from './whitelist.controller';
import { RedisModule } from 'src/redis/redis.module';
import { InteractionBusModule } from 'src/interaction-bus/interaction.bus.module';

@Module({
  imports: [RedisModule, InteractionBusModule],
  providers: [WhitelistController],
})
export class WhitelistModule {}
