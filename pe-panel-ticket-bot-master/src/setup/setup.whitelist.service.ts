import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WhiteListCommandGroup } from './setup.group';
import { Subcommand, Context, SlashCommandContext, Options } from 'necord';
import { AdminInterceptor } from 'src/interceptors/admin.interceptor';
import {
  SetupTicketCategoryDto,
  SetupWhitelistPanelChannelDto,
  SetupWhitelistRemoveUserDto,
  SetupWhitelistStorageForumDto,
} from './dto/setup.dto';
import { UtilsService } from 'src/utils/utils.service';
import { InjectRedis } from 'src/redis/inject-redis.decorator';
import { RedisClient } from 'ioredis/built/connectors/SentinelConnector/types';
import { Redis } from 'ioredis';
import { RedisKeys } from 'src/redis/redis.keys';
import { RedisWhitelistQuestion } from 'src/redis/redis.types';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildChannel,
  TextBasedChannel,
} from 'discord.js';
import { SETUP_ROUTES } from './setup.routes';
import { WHITELIST_ROUTES } from 'src/whitelist/whitelist.routes';
import { DBConnectionFactory } from 'src/factories/dbconnection.factory';
import { InjectI18n } from 'src/i18n/inject-i18n.decorator';
import { i18n } from 'i18next';

@WhiteListCommandGroup()
@Injectable()
export class SetupWhitelistService {
  private readonly logger = new Logger(SetupWhitelistService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilsService: UtilsService,
    private readonly dbConnFactory: DBConnectionFactory,
    @InjectRedis() private readonly redisClient: Redis,
    @InjectI18n() private readonly i18n: i18n,
  ) {}

  @Subcommand({
    name: 'questions',
    description: 'Open whitelist question manager.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdWLQuestions(@Context() [interaction]: SlashCommandContext) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    let embedDesc = '';
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );
    const questions = await knex().select().from('whitelistQuestions');
    if (questions) {
      embedDesc +=
        this.i18n.t('whitelist_form_questions', {
          lng: configuredLang,
          ns: 'whitelist',
        }) + ':\n\n';
      questions.forEach((item) => {
        embedDesc += `${this.i18n.t('title', {
          lng: configuredLang,
          ns: 'whitelist',
        })}: ${item.Title}\n`;
        embedDesc += `${this.i18n.t('question', {
          lng: configuredLang,
          ns: 'whitelist',
        })}: ${item.Question}\n`;
      });
    } else {
      embedDesc += this.i18n.t('no_question_configured_alert', {
        lng: configuredLang,
        ns: 'whitelist',
      });
    }
    const embed = this.utilsService.buildNewEmbed(
      this.i18n.t('whitelist_question_manager', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
      embedDesc,
    );
    const addQuestionButton = new ButtonBuilder()
      .setCustomId(SETUP_ROUTES.buttons.whitelistAddNewQuestion)
      .setLabel(
        this.i18n.t('whitelist_question_manager', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      )
      .setStyle(ButtonStyle.Primary);
    const saveQuestionButton = new ButtonBuilder()
      .setCustomId(SETUP_ROUTES.buttons.whitelistSaveQuestions)
      .setLabel(
        this.i18n.t('save_question', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      )
      .setStyle(ButtonStyle.Success);
    const removeQuestionButton = new ButtonBuilder()
      .setCustomId(SETUP_ROUTES.buttons.whitelistDeleteQuestion)
      .setLabel(
        this.i18n.t('remove_question', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      )
      .setStyle(ButtonStyle.Danger);
    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(addQuestionButton)
      .addComponents(removeQuestionButton)
      .addComponents(saveQuestionButton);
    await interaction.reply({ embeds: [embed], components: [actionRow] });
    return;
  }

  @Subcommand({
    name: 'forum',
    description: 'Set the forum channel that will be used for storage.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdWLForumSetup(
    @Context() [interaction]: SlashCommandContext,
    @Options() { forum }: SetupWhitelistStorageForumDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    await this.redisClient.set(
      `${interaction.guild.id}:${RedisKeys.WhitelistForumId}`,
      forum.id,
    );
    await interaction.reply({
      ephemeral: true,
      content: this.i18n.t('forum_channel_set_success', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
    });
    return;
  }

  @Subcommand({
    name: 'channel',
    description: 'Set the whitelist panel channel where users submit forms.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdPanelChannelConfigure(
    @Context() [interaction]: SlashCommandContext,
    @Options() { channel }: SetupWhitelistPanelChannelDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    if (!channel.isTextBased()) {
      await interaction.reply({
        content: this.i18n.t('select_text_based_channel', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      });
      return;
    }
    await this.redisClient.set(
      `${interaction.guild.id}:${RedisKeys.WhitelistPanelChannelId}`,
      channel.id,
    );
    await interaction.reply({
      content: this.i18n.t('channel_set_success', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
    });
    return;
  }

  @Subcommand({
    name: 'removeuser',
    description: 'Remove the user from whitelist.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdRemoveUserFromWhitelist(
    @Context() [interaction]: SlashCommandContext,
    @Options() { user }: SetupWhitelistRemoveUserDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    try {
      const knex = await this.dbConnFactory.retrieveConnection(
        interaction.guildId,
      );

      const steamid = await knex('steamdiscordpairs')
        .where('DiscordId', user.id)
        .first();
      if (steamid) {
        await knex('whitelist').where('PlayerId', steamid.SteamId).delete();
        await knex('whitelistanswers').where('DiscordId', user.id).delete();
      }
      await knex('whitelistanswers').where('DiscordId', user.id).del();
    } catch (error) {
      this.logger.error(error, error.stack);
    }
    await interaction.reply({
      content: this.i18n.t('user_whitelist_remove_success', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
    });
    return;
  }

  @Subcommand({
    name: 'start',
    description: 'Start form panel.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdPanelStart(@Context() [interaction]: SlashCommandContext) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const panelChannel = await this.redisClient.get(
      `${interaction.guild.id}:${RedisKeys.WhitelistPanelChannelId}`,
    );
    if (!panelChannel) {
      await interaction.reply({
        ephemeral: true,
        content: this.i18n.t('setup_panel_channel', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      });
      return;
    }
    const embed = this.utilsService.buildNewEmbed(
      this.i18n.t('whitelist_application_form', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
      this.i18n.t('press_button_for_submit_form', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
    );
    const channel = (await interaction.guild.channels.fetch(
      panelChannel,
    )) as TextBasedChannel;
    const button = new ButtonBuilder()
      .setCustomId(WHITELIST_ROUTES.button.startAnswering)
      .setStyle(ButtonStyle.Primary)
      .setLabel(
        this.i18n.t('start_form', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      );
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      button,
    );
    await channel.send({ embeds: [embed], components: [actionRow] });
    await interaction.reply({
      content: this.i18n.t('whitelist_started', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
    });
    return;
  }
}
