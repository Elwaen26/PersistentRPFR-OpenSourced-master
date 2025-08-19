import {
  Catch,
  Injectable,
  Logger,
  Scope,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Context, Options, SlashCommandContext, Subcommand } from 'necord';
import { UtilsCommandDecorator } from './setup.group';
import {
  SetupChannelDto,
  SetupPanelTitleDto,
  SetupPanelDescDto,
  SetupPanelCategoryDto,
  SetupPanelStaffDto,
  SetupTicketCategoryDto,
  SetupTicketPrivateCategoryDto,
  SetupTicketTranscriptForumDto,
  SetupPanelModlogChannelDto,
  SetupPanelManagerDto,
  SetupLanguageDto,
} from './dto/setup.dto';
import {
  ActionRowBuilder,
  ChannelType,
  ComponentType,
  EmbedBuilder,
  GuildTextBasedChannel,
  StringSelectMenuBuilder,
  roleMention,
} from 'discord.js';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigEnums, ConfigValueType } from '../types/setup.types';
import { AdminInterceptor } from '../interceptors/admin.interceptor';
import { DBConnectionFactory } from 'src/factories/dbconnection.factory';
import Redis from 'ioredis';
import { InjectRedis } from 'src/redis/inject-redis.decorator';
import { RedisKeys } from 'src/redis/redis.keys';
import { i18n } from 'i18next';
import { InjectI18n } from 'src/i18n/inject-i18n.decorator';

@UtilsCommandDecorator()
@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly dbConnFactory: DBConnectionFactory,
    @InjectI18n() private readonly i18n: i18n,
    @InjectRedis() private readonly redisClient: Redis,
  ) {}

  @Subcommand({
    name: 'category',
    description: 'Select category where the tickets will be opening.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdCategory(
    @Context() [interaction]: SlashCommandContext,
    @Options() { category }: SetupTicketCategoryDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    if (category && category.type == ChannelType.GuildCategory) {
      const knex = await this.dbConnFactory.retrieveConnection(
        interaction.guildId,
      );

      const resp = await knex('discordconfig')
        .where('SettingName', ConfigEnums.TICKET_CATEGORIES)
        .first();
      if (resp) {
        const parsed = JSON.parse(resp.SettingValue) as string[];
        if (parsed.length < 6) {
          parsed.push(category.id);
          knex('discordconfig')
            .where('SettingName', ConfigEnums.TICKET_CATEGORIES)
            .update('SettingValue', JSON.stringify(parsed))
            .then(() => {
              interaction.reply(
                this.i18n.t('successfully_added', {
                  lng: configuredLang,
                  ns: 'setup',
                }),
              );
            })
            .catch((error) => {
              this.logger.error(error);
              interaction.reply('ERROR! Internal server error.');
            });
        } else {
          interaction.reply(
            this.i18n.t('max_limit_category_alert', {
              lng: configuredLang,
              ns: 'setup',
            }),
          );
          return;
        }
      } else {
        const categorydto = [category.id];
        knex('discordconfig')
          .insert({
            SettingName: ConfigEnums.TICKET_CATEGORIES,
            SettingType: ConfigValueType['STRING[]'],
            SettingValue: JSON.stringify(categorydto),
          })
          .then(() => {
            interaction.reply(
              this.i18n.t('successfully_added', {
                lng: configuredLang,
                ns: 'setup',
              }),
            );
          })
          .catch((error) => {
            this.logger.error(error);
            interaction.reply('ERROR! Internal server error.');
          });
      }
    } else {
      interaction.reply(
        this.i18n.t('forum_invalid_warning', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
    }
  }

  @Subcommand({
    name: 'channel',
    description:
      'Select ticket panel channel where users click and open tickets.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdChannel(
    @Context() [interaction]: SlashCommandContext,
    @Options() { channel }: SetupChannelDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    if (channel && channel.type == ChannelType.GuildText) {
      const knex = await this.dbConnFactory.retrieveConnection(
        interaction.guildId,
      );

      knex('discordconfig')
        .insert({
          SettingName: ConfigEnums.TICKET_PANEL_CHANNEL_ID,
          SettingType: ConfigValueType.STRING,
          SettingValue: channel.id,
        })
        .onConflict('SettingName')
        .merge()
        .then(() => {
          interaction.reply(
            this.i18n.t('ticket_panel_create_success', {
              lng: configuredLang,
              ns: 'setup',
              channel: channel,
            }),
          );
        })
        .catch((error) => {
          this.logger.error(error);
          interaction.reply('Internal server error.');
        });
    } else {
      interaction.reply(
        this.i18n.t('valid_channel_make_sure', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
    }
  }

  @Subcommand({
    name: 'title',
    description: 'The title of the panel.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdTitle(
    @Context() [interaction]: SlashCommandContext,
    @Options() { title }: SetupPanelTitleDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    if (title && title.length > 0) {
      const knex = await this.dbConnFactory.retrieveConnection(
        interaction.guildId,
      );

      knex('discordconfig')
        .insert({
          SettingName: ConfigEnums.TICKET_PANEL_TITLE,
          SettingType: ConfigValueType.STRING,
          SettingValue: title,
        })
        .onConflict('SettingName')
        .merge()
        .then(() => {
          interaction.reply(
            this.i18n.t('title_successfully_set', {
              lng: configuredLang,
              ns: 'setup',
            }),
          );
        })
        .catch((error) => {
          this.logger.error(error);
          interaction.reply(
            this.i18n.t('ticket_panel_set_error', {
              lng: configuredLang,
              ns: 'setup',
            }),
          );
        });
    } else {
      interaction.reply(
        this.i18n.t('provide_valid_text', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
    }
  }

  @Subcommand({
    name: 'language',
    description: 'The language of the bot.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdLanguage(
    @Context() [interaction]: SlashCommandContext,
    @Options() { language }: SetupLanguageDto,
  ) {
    let configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    if (language && language.length > 0) {
      try {
        await this.redisClient.set(
          `${interaction.guildId}:${RedisKeys.BotLanguage}`,
          language,
        );
        configuredLang =
          (await this.redisClient.get(
            `${interaction.guildId}:${RedisKeys.BotLanguage}`,
          )) || 'en';
        await interaction.reply(
          this.i18n.t('bot_language_changed', {
            lng: configuredLang,
            ns: 'setup',
          }),
        );
      } catch (error) {
        this.logger.error(error);
        interaction.reply(
          this.i18n.t('bot_language_change_error', {
            lng: configuredLang,
            ns: 'setup',
          }),
        );
      }
    } else {
      interaction.reply(
        this.i18n.t('provide_valid_text', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
    }
  }

  @Subcommand({
    name: 'desc',
    description: 'The description of the panel.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdDesc(
    @Context() [interaction]: SlashCommandContext,
    @Options() { desc }: SetupPanelDescDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    if (desc && desc.length > 0) {
      const knex = await this.dbConnFactory.retrieveConnection(
        interaction.guildId,
      );
      knex('discordconfig')
        .insert({
          SettingName: ConfigEnums.TICKET_PANEL_DESC,
          SettingType: ConfigValueType.STRING,
          SettingValue: desc,
        })
        .onConflict('SettingName')
        .merge()
        .then(() => {
          interaction.reply(
            this.i18n.t('ticket_desc_successfully_set', {
              lng: configuredLang,
              ns: 'setup',
            }),
          );
        })
        .catch((error) => {
          this.logger.error(error);
          interaction.reply(
            this.i18n.t('ticket_desc_error', {
              lng: configuredLang,
              ns: 'setup',
            }),
          );
        });
    } else {
      interaction.reply(
        this.i18n.t('provide_valid_text', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
    }
  }

  @Subcommand({
    name: 'dropdown',
    description: 'Please seperate the categories with comma (,).',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdCategories(
    @Context() [interaction]: SlashCommandContext,
    @Options() { categories }: SetupPanelCategoryDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    if (categories && categories.length > 0) {
      const inputArr = categories.split(',');
      const categoriesArr = inputArr.filter(
        (value) => value && value.length > 0,
      );
      this.logger.debug(JSON.stringify(categoriesArr));
      const knex = await this.dbConnFactory.retrieveConnection(
        interaction.guildId,
      );

      knex('discordconfig')
        .insert({
          SettingName: ConfigEnums.TICKET_PANEL_DROPDOWN,
          SettingType: ConfigValueType['STRING[]'],
          SettingValue: JSON.stringify(categoriesArr),
        })
        .onConflict('SettingName')
        .merge()
        .then(() => {
          interaction.reply(
            this.i18n.t('categories_set', {
              lng: configuredLang,
              ns: 'setup',
            }),
          );
        })
        .catch((error) => {
          this.logger.error(error);
          interaction.reply(
            this.i18n.t('categories_set_error', {
              lng: configuredLang,
              ns: 'setup',
            }),
          );
        });
    } else {
      interaction.reply(
        this.i18n.t('provide_valid_text', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
    }
  }

  @Subcommand({
    name: 'privatecategories',
    description: 'Please provide valid category.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdPrivateCategories(
    @Context() [interaction]: SlashCommandContext,
    @Options() { category }: SetupTicketPrivateCategoryDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    if (category && category.type === ChannelType.GuildCategory) {
      const knex = await this.dbConnFactory.retrieveConnection(
        interaction.guildId,
      );

      const result = await knex('discordconfig')
        .where('SettingName', ConfigEnums.TICKET_PRIVATE_CATEGORIES)
        .first();
      if (result) {
        const privCategories = JSON.parse(result.SettingValue) as string[];
        const isDuplicate = privCategories.find((item) => item === category.id);
        if (!isDuplicate) {
          privCategories.push(category.id);
          await knex('discordconfig')
            .where('SettingName', ConfigEnums.TICKET_PRIVATE_CATEGORIES)
            .update({
              SettingValue: JSON.stringify(privCategories),
            });
          interaction.reply(
            this.i18n.t('successfully_added', {
              lng: configuredLang,
              ns: 'setup',
            }),
          );
        } else {
          interaction.reply(
            this.i18n.t('private_category_already_set', {
              lng: configuredLang,
              ns: 'setup',
              name: category,
            }),
          );
        }
      } else {
        const categoriesToBeAdded = [category.id];
        await knex('discordconfig')
          .insert({
            SettingName: ConfigEnums.TICKET_PRIVATE_CATEGORIES,
            SettingType: ConfigValueType['STRING[]'],
            SettingValue: JSON.stringify(categoriesToBeAdded),
          })
          .then(() => {
            interaction.reply(
              this.i18n.t('successfully_added', {
                lng: configuredLang,
                ns: 'setup',
              }),
            );
          })
          .catch((error) => {
            this.logger.error(error);
            interaction.reply('ERROR! Internal server error.');
          });
      }
    } else {
      interaction.reply(
        this.i18n.t('provide_valid_text', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
    }
  }

  @Subcommand({
    name: 'transcriptchannel',
    description:
      'Please provide forum that will be used as transcript storage.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdTranscriptChannel(
    @Context() [interaction]: SlashCommandContext,
    @Options() { forum }: SetupTicketTranscriptForumDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    if (forum && forum.type === ChannelType.GuildForum) {
      const knex = await this.dbConnFactory.retrieveConnection(
        interaction.guildId,
      );

      const result = await knex('discordconfig')
        .where('SettingName', ConfigEnums.TICKET_TRANSCRIPT_CHANNEL)
        .first();
      if (result) {
        await knex('discordconfig')
          .where('SettingName', ConfigEnums.TICKET_TRANSCRIPT_CHANNEL)
          .update({
            SettingValue: forum.id,
          });
        interaction.reply(
          this.i18n.t('transcript_channel_set', {
            lng: configuredLang,
            ns: 'setup',
          }),
        );
      } else {
        knex('discordconfig')
          .insert({
            SettingName: ConfigEnums.TICKET_TRANSCRIPT_CHANNEL,
            SettingType: ConfigValueType.STRING,
            SettingValue: forum.id,
          })
          .then(() => {
            interaction.reply(
              this.i18n.t('transcript_channel_set', {
                lng: configuredLang,
                ns: 'setup',
              }),
            );
          })
          .catch((error) => {
            this.logger.error(error);
            interaction.reply('ERROR! Internal server error.');
          });
      }
    } else {
      interaction.reply(
        this.i18n.t('provide_valid_text', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
    }
  }

  @Subcommand({
    name: 'modlog',
    description: 'Please select a channel that will be used as modlog.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdModlog(
    @Context() [interaction]: SlashCommandContext,
    @Options() { modlog }: SetupPanelModlogChannelDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    try {
      const knex = await this.dbConnFactory.retrieveConnection(
        interaction.guildId,
      );

      await knex('discordconfig')
        .insert({
          SettingName: ConfigEnums.TICKET_MODLOG_CHANNEL,
          SettingType: ConfigValueType.STRING,
          SettingValue: modlog.id,
        })
        .onConflict('SettingName')
        .merge();
      await interaction.reply({
        content: this.i18n.t('modlog_channel_set', {
          lng: configuredLang,
          ns: 'setup',
        }),
      });
    } catch (error) {
      this.logger.error(error, error.stack);
      await interaction.reply({
        content: 'Internal server error.',
        ephemeral: true,
      });
    }
  }

  @Subcommand({
    name: 'staff',
    description: 'Please select a staff role that will include to tickets.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdStaff(
    @Context() [interaction]: SlashCommandContext,
    @Options() { staff }: SetupPanelStaffDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    if (staff) {
      try {
        const knex = await this.dbConnFactory.retrieveConnection(
          interaction.guildId,
        );

        const currentStaffGroup = await knex('discordconfig')
          .where('SettingName', ConfigEnums.TICKET_PANEL_STAFF_GROUPS)
          .first();
        if (currentStaffGroup) {
          const parsed = JSON.parse(currentStaffGroup.SettingValue) as string[];

          parsed.push(staff.id);
          await knex('discordconfig')
            .where('SettingName', ConfigEnums.TICKET_PANEL_STAFF_GROUPS)
            .update({
              SettingValue: JSON.stringify(parsed),
            });
        } else {
          const addStaff = [staff.id];
          await knex('discordconfig').insert({
            SettingName: ConfigEnums.TICKET_PANEL_STAFF_GROUPS,
            SettingType: ConfigValueType['STRING[]'],
            SettingValue: JSON.stringify(addStaff),
          });
        }
        interaction.reply(
          this.i18n.t('staff_add_success', {
            lng: configuredLang,
            ns: 'setup',
            name: roleMention(staff.id),
          }),
        );
      } catch (error) {
        this.logger.error(error);
        interaction.reply('ERROR! Internal server error.');
      }
    } else {
      interaction.reply(
        this.i18n.t('provide_valid_text', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
    }
  }

  @Subcommand({
    name: 'manager',
    description:
      'Please select a manager role that will have access to some private commands.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdAdmin(
    @Context() [interaction]: SlashCommandContext,
    @Options() { manager }: SetupPanelManagerDto,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    if (manager) {
      try {
        const knex = await this.dbConnFactory.retrieveConnection(
          interaction.guildId,
        );

        const currentManagerGroups = await knex('discordconfig')
          .where('SettingName', ConfigEnums.TICKET_PANEL_MANAGER_GROUPS)
          .first();
        if (currentManagerGroups) {
          const parsed = JSON.parse(
            currentManagerGroups.SettingValue,
          ) as string[];

          parsed.push(manager.id);
          await knex('discordconfig')
            .where('SettingName', ConfigEnums.TICKET_PANEL_MANAGER_GROUPS)
            .update({
              SettingValue: JSON.stringify(parsed),
            });
        } else {
          const addManagers = [manager.id];
          await knex('discordconfig').insert({
            SettingName: ConfigEnums.TICKET_PANEL_MANAGER_GROUPS,
            SettingType: ConfigValueType['STRING[]'],
            SettingValue: JSON.stringify(addManagers),
          });
        }
        interaction.reply(
          this.i18n.t('manager_add_success', {
            lng: configuredLang,
            ns: 'setup',
            name: manager,
          }),
        );
      } catch (error) {
        this.logger.error(error);
        interaction.reply('ERROR! Internal server error.');
      }
    } else {
      interaction.reply(
        this.i18n.t('provide_valid_text', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
    }
  }

  @Subcommand({
    name: 'resetstaff',
    description: 'That command will reset the all admin staff configured',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdStaffReset(@Context() [interaction]: SlashCommandContext) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );
    knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_PANEL_STAFF_GROUPS)
      .update({
        SettingValue: '[]',
      })
      .then(() => {
        interaction.reply(
          this.i18n.t('staff_reset_success', {
            lng: configuredLang,
            ns: 'setup',
          }),
        );
      })
      .catch((error) => {
        this.logger.error(error);
        interaction.reply('ERROR! Internal server error.');
      });
  }

  @Subcommand({
    name: 'start',
    description: 'Sends the message with provided config.',
  })
  @UseInterceptors(AdminInterceptor)
  public async onCmdStart(@Context() [interaction]: SlashCommandContext) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );

    const channel = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_PANEL_CHANNEL_ID)
      .first();

    if (!channel) {
      interaction.reply(
        this.i18n.t('setup_ticket_panel_warning', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
      return;
    }

    const categoriesdb = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_CATEGORIES)
      .first();

    if (!categoriesdb) {
      interaction.reply(
        this.i18n.t('setup_ticket_panel_warning', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
      return;
    }

    const title = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_PANEL_TITLE)
      .first();

    if (!title) {
      interaction.reply(
        this.i18n.t('setup_ticket_title_warning', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
      return;
    }

    const desc = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_PANEL_DESC)
      .first();

    if (!desc) {
      interaction.reply(
        this.i18n.t('setup_ticket_desc_warning', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
      return;
    }

    const categories = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_PANEL_DROPDOWN)
      .first();

    if (!categories) {
      interaction.reply(
        this.i18n.t('setup_ticket_dropdown_warning', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
      return;
    }

    const staffGroup = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_PANEL_STAFF_GROUPS)
      .first();

    if (!staffGroup) {
      interaction.reply(
        this.i18n.t('setup_staff_warning', {
          lng: configuredLang,
          ns: 'setup',
        }),
      );
      return;
    }

    const categoriesArray = JSON.parse(categories.SettingValue) as string[];

    const embed = new EmbedBuilder()
      .setColor(0xbd9f26)
      .setTitle(title.SettingValue)
      .setDescription(desc.SettingValue)
      .setFooter({
        iconURL:
          'https://cdn.discordapp.com/icons/691045202864898109/516a15b8c83eb141b027621b00afab18.webp?size=100',
        text: 'Powered by Alverrt#4727',
      });

    const selectMenu =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder({ type: ComponentType.StringSelect })
          .setCustomId('selectmenu')
          .setPlaceholder(
            this.i18n.t('select_category', {
              lng: configuredLang,
              ns: 'setup',
            }),
          )
          .addOptions(
            categoriesArray.map((value) => {
              return {
                label: value,
                value: value,
              };
            }),
          ),
      );

    const ticketChannel = interaction.guild.channels.cache.get(
      channel.SettingValue,
    ) as GuildTextBasedChannel;

    await ticketChannel.send({ embeds: [embed], components: [selectMenu] });
    interaction.reply(
      this.i18n.t('ticket_panel_start_success', {
        lng: configuredLang,
        ns: 'setup',
      }),
    );
  }
}
