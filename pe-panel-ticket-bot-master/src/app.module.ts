import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GatewayIntentBits } from 'discord.js';
import { NecordModule } from 'necord';
import { SetupModule } from './setup/setup.module';
import { TicketsModule } from './tickets/tickets.module';
import { UtilsService } from './utils/utils.service';
import { UtilsModule } from './utils/utils.module';
import { ClaimsModule } from './claims/claims.module';
import { TranscriptsModule } from './transcripts/transcripts.module';
import { BullModule } from '@nestjs/bull';
import * as path from 'path';
import { ModerationModule } from './moderation/moderation.module';
import { EventsModule } from './events/events.module';
import { StatsModule } from './stats/stats.module';
import { WhitelistModule } from './whitelist/whitelist.module';
import { DBConnectionFactory } from './factories/dbconnection.factory';
import { FactoryModule } from './factories/factory.module';
import { I18nModule } from './i18n/i18n.module';

@Module({
  imports: [
    TranscriptsModule,
    NecordModule.forRoot({
      token: process.env.DISCORD_TOKEN,
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
      ],
      development:
        process.env.NODE_ENV === 'development'
          ? [process.env.DISCORD_DEVELOPMENT_GUILD_ID]
          : false,
    }),
    I18nModule,
    ConfigModule.forRoot(),
    PrismaModule,
    SetupModule,
    TicketsModule,
    UtilsModule,
    ClaimsModule,
    ModerationModule,
    EventsModule,
    StatsModule,
    WhitelistModule,
    FactoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
