import { Module } from '@nestjs/common';
import { SetupService } from './setup.service';
import { SetupWhitelistController } from './setup.whitelist.controller';
import { SetupWhitelistService } from './setup.whitelist.service';
import { RedisModule } from 'src/redis/redis.module';
import { InteractionBusModule } from 'src/interaction-bus/interaction.bus.module';

@Module({
  imports: [RedisModule, InteractionBusModule],
  providers: [SetupService, SetupWhitelistController, SetupWhitelistService],
})
export class SetupModule {}
