import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { UtilsCommandDecorator } from './moderation.group';
import { PrismaService } from '../prisma/prisma.service';
import {
  Context,
  Options,
  SlashCommandContext,
  StringOption,
  Subcommand,
} from 'necord';
import {
  ModerationAddPlayerDto,
  ModerationAddUserDto,
  ModerationChangeInGameNameDto,
  ModerationRemoveUserDto,
} from './dto/moderation.dto';
import { UtilsService } from '../utils/utils.service';
import { GuildChannel, PermissionFlagsBits, userMention } from 'discord.js';
import { ModerationInterceptor } from '../interceptors/moderation.interceptor';
import { DBConnectionFactory } from 'src/factories/dbconnection.factory';
import Redis from 'ioredis';
import { InjectI18n } from 'src/i18n/inject-i18n.decorator';
import { InjectRedis } from 'src/redis/inject-redis.decorator';
import { i18n } from 'i18next';
import { RedisKeys } from 'src/redis/redis.keys';
import { ConfigEnums } from 'src/types/setup.types';

@UtilsCommandDecorator()
@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utils: UtilsService,
    private readonly dbbConnFactory: DBConnectionFactory,
    @InjectI18n() private readonly i18n: i18n,
    @InjectRedis() private readonly redisClient: Redis,
  ) {}

  @Subcommand({
    name: 'addplayer',
    description: 'Type players EXACT in-game name.',
  })
  @UseInterceptors(ModerationInterceptor)
  async onModerationAddPlayer(
    @Context() [interaction]: SlashCommandContext,
    @Options() { playername }: ModerationAddPlayerDto,
  ) {
    const knex = await this.dbbConnFactory.retrieveConnection(
      interaction.guildId,
    );
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';

    const result = await knex('playernames')
      .where('PlayerName', playername)
      .first();
    if (!result) {
      await interaction.reply({
        content: this.i18n.t('couldnt_find_him', {
          lng: configuredLang,
          ns: 'moderation',
        }),
      });
      return;
    }

    const discordid = await knex('players')
      .where('PlayerId', result.PlayerId)
      .first();
    const embederror = this.utils.buildNewEmbed(
      this.i18n.t('couldnt_find_him', {
        lng: configuredLang,
        ns: 'moderation',
      }),
      this.i18n.t('couldnt_find_him_desc', {
        lng: configuredLang,
        ns: 'moderation',
      }),
    );
    let user = null;
    if (discordid) {
      if (discordid.DiscordId) {
        this.logger.debug(discordid.DiscordId);
        try {
          user = await interaction.guild.members.fetch(discordid.DiscordId);
          if (user) {
            await (
              interaction.channel as GuildChannel
            ).permissionOverwrites.create(user, {
              ViewChannel: true,
              SendMessages: true,
            });
          } else {
            throw new Error('Member is not in our discord.');
          }
        } catch (error) {
          await interaction.reply({
            embeds: [embederror],
          });
          return;
        }
      }
    }

    const embed = this.utils.buildNewEmbed(
      this.i18n.t('new_user_added', {
        lng: configuredLang,
        ns: 'moderation',
      }),
      this.i18n.t('new_user_added_desc', {
        lng: configuredLang,
        ns: 'moderation',
        name: user,
      }),
    );

    await interaction.reply({
      embeds: [user ? embed : embederror],
      ...(user && {
        content: this.i18n.t('ping_user', {
          lng: configuredLang,
          ns: 'moderation',
          name: user,
        }),
      }),
    });
    return;
  }

  @Subcommand({
    name: 'adduser',
    description: 'Type discord user to add to ticket.',
  })
  @UseInterceptors(ModerationInterceptor)
  async onModerationAddUser(
    @Context() [interaction]: SlashCommandContext,
    @Options() { user }: ModerationAddUserDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    try {
      await (interaction.channel as GuildChannel).permissionOverwrites.create(
        user,
        { ViewChannel: true, SendMessages: true },
      );
      const embed = this.utils.buildNewEmbed(
        this.i18n.t('new_user_added', {
          lng: configuredLang,
          ns: 'moderation',
        }),
        this.i18n.t('new_user_added_desc', {
          lng: configuredLang,
          ns: 'moderation',
          name: user,
        }),
      );
      await interaction.reply({
        content: this.i18n.t('ping_user', {
          lng: configuredLang,
          ns: 'moderation',
          name: user,
        }),
        embeds: [embed],
      });
    } catch (error) {
      this.logger.error(error, error.stack);
      await interaction.reply({
        content: this.i18n.t('user_is_not_in_server', {
          lng: configuredLang,
          ns: 'moderation',
        }),
        ephemeral: true,
      });
    }
  }

  @Subcommand({
    name: 'changeigname',
    description: 'Change users in-game names.',
  })
  @UseInterceptors(ModerationInterceptor)
  async onChangeName(
    @Context() [interaction]: SlashCommandContext,
    @Options() { user, playername }: ModerationChangeInGameNameDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const knex = await this.dbbConnFactory.retrieveConnection(
      interaction.guildId,
    );
    try {
      const currentManagerGroups = await knex('discordconfig')
        .where('SettingName', ConfigEnums.TICKET_PANEL_MANAGER_GROUPS)
        .first();
      const parsedManagerIds: string[] = JSON.parse(
        currentManagerGroups.SettingValue,
      );
      if (!parsedManagerIds.includes(interaction.user.id)) {
        if (
          !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)
        ) {
          await interaction.reply({
            content: this.i18n.t('no_permission', {
              lng: configuredLang,
              ns: 'moderation',
            }),
          });
          return;
        }
      }
      try {
        const player = await knex('players')
          .where('DiscordId', user.id)
          .first();
        if (!player) {
          await interaction.reply({
            content: this.i18n.t('couldnt_find_user_for_name_change', {
              lng: configuredLang,
              ns: 'moderation',
            }),
            ephemeral: true,
          });
          return;
        }
        await knex('players')
          .where('DiscordId', user.id)
          .update({ CustomName: playername });
      } catch (error) {
        this.logger.error(error, error.stack);
        await interaction.reply({
          content: this.i18n.t('couldnt_find_user_for_name_change', {
            lng: configuredLang,
            ns: 'moderation',
          }),
          ephemeral: true,
        });
        return;
      }
      await interaction.reply({
        content: this.i18n.t('player_name_change_success', {
          lng: configuredLang,
          ns: 'moderation',
        }),
      });
    } catch (error) {
      this.logger.error(error, error.stack);
      await interaction.reply({
        content: this.i18n.t('user_is_not_in_channel', {
          lng: configuredLang,
          ns: 'moderation',
        }),
        ephemeral: true,
      });
    }
  }

  @Subcommand({
    name: 'removeuser',
    description: 'Type discord user to remove from ticket.',
  })
  @UseInterceptors(ModerationInterceptor)
  async onModerationRemoveUser(
    @Context() [interaction]: SlashCommandContext,
    @Options() { user }: ModerationRemoveUserDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    try {
      await (interaction.channel as GuildChannel).permissionOverwrites.create(
        user,
        { ViewChannel: false },
      );
      const embed = this.utils.buildNewEmbed(
        this.i18n.t('user_remove', {
          lng: configuredLang,
          ns: 'moderation',
        }),
        this.i18n.t('user_remove_desc', {
          lng: configuredLang,
          ns: 'moderation',
          user: user,
        }),
      );
      await interaction.reply({
        embeds: [embed],
      });
    } catch (error) {
      this.logger.error(error, error.stack);
      await interaction.reply({
        content: this.i18n.t('user_is_not_in_channel', {
          lng: configuredLang,
          ns: 'moderation',
        }),
        ephemeral: true,
      });
    }
  }
}
