import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
  Collection,
  ComponentType,
  EmbedBuilder,
  GuildMember,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  OverwriteResolvable,
  PermissionFlagsBits,
  roleMention,
  StringSelectMenuBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  userMention,
} from 'discord.js';
import {
  Button,
  ButtonContext,
  ComponentParam,
  Context,
  Ctx,
  Modal,
  ModalContext,
  ModalParam,
  SelectedStrings,
  StringSelect,
  StringSelectContext,
} from 'necord';
import { TranscriptsService } from 'src/transcripts/transcripts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigEnums } from '../types/setup.types';
import { UtilsService } from '../utils/utils.service';
import { ModerationInterceptor } from '../interceptors/moderation.interceptor';
import { DBConnectionFactory } from 'src/factories/dbconnection.factory';
import { InjectI18n } from 'src/i18n/inject-i18n.decorator';
import { i18n } from 'i18next';
import Redis from 'ioredis';
import { InjectRedis } from 'src/redis/inject-redis.decorator';
import { RedisKeys } from 'src/redis/redis.keys';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly utils: UtilsService,
    private readonly transcriptsService: TranscriptsService,
    private readonly dbConnFactory: DBConnectionFactory,
    @InjectI18n() private readonly i18n: i18n,
    @InjectRedis() private readonly redisClient: Redis,
  ) {}

  @StringSelect('selectmenu')
  public async onStringSelect(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() selected: string[],
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const modal = new ModalBuilder()
      .setCustomId(`ticketModal/${selected.join(' ')}`)
      .setTitle(
        this.i18n.t('new_ticket', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      );

    const dateInput = new TextInputBuilder()
      .setCustomId('date')
      .setLabel(
        this.i18n.t('ticket_date', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      )
      .setPlaceholder(
        this.i18n.t('ticket_date_format', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      )
      .setStyle(TextInputStyle.Short)
      .setMinLength(0)
      .setMaxLength(100)
      .setRequired(true);

    const timeInput = new TextInputBuilder()
      .setCustomId('time')
      .setLabel(
        this.i18n.t('ticket_time', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      )
      .setPlaceholder(
        this.i18n.t('ticket_time_format', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      )
      .setStyle(TextInputStyle.Short)
      .setMinLength(0)
      .setMaxLength(100)
      .setRequired(true);

    const issuerNameInput = new TextInputBuilder()
      .setCustomId('issuername')
      .setLabel(
        this.i18n.t('ingame_name', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      )
      .setPlaceholder(
        this.i18n.t('ingame_name_placeholder', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      )
      .setStyle(TextInputStyle.Short)
      .setMinLength(0)
      .setMaxLength(200)
      .setRequired(true);

    const issuedPlayersInput = new TextInputBuilder()
      .setCustomId('issuednames')
      .setLabel(
        this.i18n.t('issued_players', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      )
      .setPlaceholder(
        this.i18n.t('issued_players_placeholder', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      )
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(0)
      .setMaxLength(1000)
      .setRequired(true);

    const detailsInput = new TextInputBuilder()
      .setCustomId('details')
      .setLabel(
        this.i18n.t('incident_details', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      )
      .setPlaceholder(
        this.i18n.t('incident_details_placeholder', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      )
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(0)
      .setMaxLength(2000)
      .setRequired(true);

    const dateActionRow =
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        dateInput,
      );
    const timeActionRow =
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        timeInput,
      );
    const issuerNameActionRow =
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        issuerNameInput,
      );
    const issuedPlayersActionRow =
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        issuedPlayersInput,
      );
    const detailsActionRow =
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        detailsInput,
      );

    modal.addComponents([
      dateActionRow,
      timeActionRow,
      issuerNameActionRow,
      issuedPlayersActionRow,
      detailsActionRow,
    ]);
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );

    const categories = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_PANEL_DROPDOWN)
      .first();
    const categoriesArray = JSON.parse(categories.SettingValue) as string[];
    const selectMenu =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder({ type: ComponentType.StringSelect })
          .setCustomId('selectmenu')
          .setPlaceholder(
            this.i18n.t('select_category', {
              lng: configuredLang,
              ns: 'tickets',
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

    await interaction.message.edit({ components: [selectMenu] });

    await interaction.showModal(modal);
  }

  @Modal('ticketModal/:category')
  public async onModal(
    @Ctx() [interaction]: ModalContext,
    @ModalParam('category') category: string,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const dateInput = interaction.fields.getTextInputValue('date');
    const timeInput = interaction.fields.getTextInputValue('time');
    const issuerNameInput = interaction.fields.getTextInputValue('issuername');
    const issuedNamesInput =
      interaction.fields.getTextInputValue('issuednames');
    const detailsInput = interaction.fields.getTextInputValue('details');

    const embedHeader = new EmbedBuilder()
      .setColor(0xbd9f26)
      .setTitle(
        this.i18n.t('select_category', {
          lng: configuredLang,
          ns: 'ticket_embed_title',
        }),
      )
      .setDescription(
        this.i18n.t('ticket_embed_desc', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      )
      .setFooter({
        iconURL:
          'https://cdn.discordapp.com/icons/691045202864898109/516a15b8c83eb141b027621b00afab18.webp?size=100',
        text: 'Powered by Alverrt#4727',
      });

    const embedBody = new EmbedBuilder()
      .setColor(0xbd9f26)
      .setFields([
        {
          name: this.i18n.t('complaint_category', {
            lng: configuredLang,
            ns: 'tickets',
          }),
          value: category,
        },
        {
          name: this.i18n.t('event_date', {
            lng: configuredLang,
            ns: 'tickets',
          }),
          value: dateInput,
        },
        {
          name: this.i18n.t('event_time', {
            lng: configuredLang,
            ns: 'tickets',
          }),
          value: timeInput,
        },
        {
          name: this.i18n.t('issuer_player_name', {
            lng: configuredLang,
            ns: 'tickets',
          }),
          value: issuerNameInput,
        },
        {
          name: this.i18n.t('issued_players_e', {
            lng: configuredLang,
            ns: 'tickets',
          }),
          value: issuedNamesInput,
        },
        {
          name: this.i18n.t('event_details', {
            lng: configuredLang,
            ns: 'tickets',
          }),
          value: detailsInput,
        },
      ])
      .setFooter({ text: 'Powered by Alverrt#4727' });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents([
      new ButtonBuilder()
        .setCustomId('closeticket')
        .setEmoji('⚠️')
        .setLabel(
          this.i18n.t('close_ticket', {
            lng: configuredLang,
            ns: 'tickets',
          }),
        )
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('closewithreason')
        .setEmoji('📤')
        .setLabel(
          this.i18n.t('close_with_reason', {
            lng: configuredLang,
            ns: 'tickets',
          }),
        )
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('claimticket')
        .setEmoji('👋')
        .setLabel(
          this.i18n.t('claim_ticket', {
            lng: configuredLang,
            ns: 'tickets',
          }),
        )
        .setStyle(ButtonStyle.Success),
    ]);

    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );

    const categoriesRaw = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_CATEGORIES)
      .first();

    const parsedCategories = JSON.parse(categoriesRaw.SettingValue) as string[];
    const issuedPlayers = issuedNamesInput.split(',');

    const resp = await knex('playernames')
      .select()
      .whereIn('PlayerName', issuedPlayers);
    let permissions: string[] | null = null;
    if (resp) {
      // Set obj will remove duplicate values
      const playerids = [...new Set(resp.map((item) => item.PlayerId))];

      const pairs = await knex('players')
        .whereIn('PlayerId', playerids)
        .select();
      permissions = pairs.map((item) =>
        item.DiscordId ? item.DiscordId : 'null',
      );
    }
    permissions = permissions.filter(
      (item) => item.length > 0 && item !== 'null',
    );

    let selectedCategory: CategoryChannel | null = null;
    for (let index = 0; index < parsedCategories.length; index++) {
      try {
        const category = (await interaction.guild.channels.fetch(
          parsedCategories[index],
          { cache: false },
        )) as CategoryChannel;
        if (category.children.cache.size < 50) {
          selectedCategory = category;
          break;
        }
      } catch (error) {
        this.logger.error(error, error.stack);
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (!selectedCategory) {
      await interaction.reply(
        this.i18n.t('no_category', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      );
      return;
    }

    const ticketCount = await knex('discordtickets')
      .orderBy('CreatedAt', 'desc')
      .first();
    let ticketName = 'ticket';
    if (ticketCount) {
      ticketName = `ticket-${ticketCount.TicketID}`;
    } else {
      ticketName = 'ticket-0';
    }
    let ticketChannel: TextChannel | null = null;
    try {
      ticketChannel = await interaction.guild.channels.create({
        name: ticketName,
        parent: selectedCategory,
        permissionOverwrites: [
          {
            id: interaction.channel.guild.roles.everyone,
            deny: ['ViewChannel'],
          },
          {
            id: interaction.user,
            allow: ['ViewChannel', 'SendMessages'],
          },
        ],
      });
    } catch (error) {
      this.logger.error(error, error.stack);
    }
    for (let index = 0; index < permissions.length; index++) {
      try {
        const user = await interaction.client.users.fetch(permissions[index]);
        if (!user) {
          continue;
        }
        this.logger.debug(user);
        await ticketChannel.permissionOverwrites.create(user, {
          ViewChannel: true,
          SendMessages: true,
        });
      } catch (error) {
        this.logger.error(error, error.stack);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    let addedIssuedPlayers = '';
    if (permissions) {
      permissions.forEach((item) => {
        addedIssuedPlayers +=
          item && item.length > 0 ? `${userMention(item)}\n` : '';
      });
    }

    const embedFooter = this.utils.buildNewEmbed(
      this.i18n.t('auto_added_users_title', {
        lng: configuredLang,
        ns: 'tickets',
      }),
      addedIssuedPlayers.length > 0
        ? this.i18n.t('auto_added_users_success', {
            lng: configuredLang,
            ns: 'tickets',
            names: addedIssuedPlayers,
          })
        : this.i18n.t('auto_added_users_error', {
            lng: configuredLang,
            ns: 'tickets',
          }),
    );

    const staffRoles = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_PANEL_STAFF_GROUPS)
      .first();
    const staff = JSON.parse(staffRoles.SettingValue) as string[];

    // immediately-invoked function expression for adding roles in sequence
    let addedStaffMember = 0;
    (async function addStaffRoles() {
      const role = await interaction.guild.roles.fetch(staff[addedStaffMember]);
      await ticketChannel.permissionOverwrites.create(role, {
        ViewChannel: true,
        SendMessages: true,
      });
      addedStaffMember += 1;

      if (addedStaffMember !== staff.length) {
        await addStaffRoles();
      } else {
        return;
      }
    })();

    const ticketMsg = await ticketChannel.send({
      embeds: [embedHeader, embedBody, embedFooter],
      components: [buttons],
      content: `${this.i18n.t('ticket_created', {
        lng: configuredLang,
        ns: 'tickets',
        channel: ticketChannel,
      })} ${interaction.user}, ${addedIssuedPlayers}`,
    });

    interaction.reply({
      content: this.i18n.t('ticket_created', {
        lng: configuredLang,
        ns: 'tickets',
        channel: ticketChannel,
      }),
      ephemeral: true,
    });

    setTimeout(() => {
      interaction.deleteReply();
    }, 5000);

    await knex('discordtickets').insert({
      ChannelId: ticketChannel.id,
      IssuerId: interaction.user.id,
      MessageId: ticketMsg.id,
      ParentId: selectedCategory.id,
    });
  }

  @Button('closeticket')
  public async onButtonCloseTicket(@Context() [interaction]: ButtonContext) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );

    const ticketInfo = await knex('discordtickets')
      .where('ChannelId', interaction.channel.id)
      .first();

    const staffGroups = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_PANEL_STAFF_GROUPS)
      .first();
    const parsedStaffGroups = JSON.parse(staffGroups.SettingValue) as string[];

    const userIsStaffMember = (
      interaction.member as GuildMember
    ).roles.cache.some((item) => parsedStaffGroups.includes(item.id));
    if (
      interaction.user.id === ticketInfo.IssuerId ||
      userIsStaffMember ||
      interaction.memberPermissions.has(PermissionFlagsBits.Administrator)
    ) {
      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId(`closeticketapprove/${interaction.user.id}/true`)
          .setLabel(
            this.i18n.t('yes', {
              lng: configuredLang,
              ns: 'tickets',
            }),
          )
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`closeticketapprove/${interaction.user.id}/false`)
          .setLabel(
            this.i18n.t('close_without_transcript', {
              lng: configuredLang,
              ns: 'tickets',
            }),
          )
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`closeticketdismiss/${interaction.user.id}`)
          .setLabel(
            this.i18n.t('no', {
              lng: configuredLang,
              ns: 'tickets',
            }),
          )
          .setStyle(ButtonStyle.Secondary),
      ]);

      const embed = new EmbedBuilder()
        .setColor(0xbd9f26)
        .setTitle(
          this.i18n.t('ticket_close_approve', {
            lng: configuredLang,
            ns: 'tickets',
          }),
        )
        .setDescription(
          `${interaction.user} ${this.i18n.t('ticket_close_approve_desc', {
            lng: configuredLang,
            ns: 'tickets',
          })}`,
        )
        .setFooter({
          iconURL:
            'https://cdn.discordapp.com/icons/691045202864898109/516a15b8c83eb141b027621b00afab18.webp?size=100',
          text: 'Powered by Alverrt#4727',
        });
      await interaction.channel.send({
        embeds: [embed],
        components: [buttons],
      });
      return await interaction.deferUpdate();
    } else {
      await interaction.reply({
        content: this.i18n.t('no_permission', {
          lng: configuredLang,
          ns: 'tickets',
        }),
        ephemeral: true,
      });
    }
  }

  @Button('closeticketdismiss/:value')
  public async onButtonCloseTicketDismiss(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('value') value: string,
  ) {
    if (interaction.user.id === value) {
      if (interaction.message.deletable) {
        await interaction.message.delete();
      } else {
        this.logger.debug('not deletable');
      }
    } else {
      await interaction.deferUpdate();
      return;
    }
  }

  @Button('closeticketapprove/:value/:transcriptIncluded')
  public async onButtonTest(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('value') value: string,
    @ComponentParam('transcriptIncluded') transcriptIncluded: string,
  ) {
    if (interaction.user.id !== value) {
      await interaction.deferUpdate();
      return;
    }
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );

    const result = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_TRANSCRIPT_CHANNEL)
      .first();
    if (!result) {
      await interaction.reply(
        this.i18n.t('delete_ticket_no_transcript', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      );
      await interaction.channel.delete();
      return;
    }

    const resp = await knex('discordtickets')
      .where('ChannelId', interaction.channel.id)
      .first();

    const embed = this.utils.buildNewEmbed(
      this.i18n.t('dm_ticket_close_title', {
        lng: configuredLang,
        ns: 'tickets',
      }),
      this.i18n.t('dm_ticket_close_desc', {
        lng: configuredLang,
        ns: 'tickets',
      }),
    );
    await interaction.channel.send({ embeds: [embed] });
    await interaction.deferUpdate();
    try {
      if (resp) {
        let channelid = '';
        let closedbyid = '';
        const issuerId = resp.IssuerId;
        const issuer = await interaction.guild.members.fetch(issuerId);
        if (transcriptIncluded === 'true') {
          await this.transcriptsService.addNewTranscriptJob(
            result.SettingValue,
            interaction.channel.id,
            interaction.channel.name.toString(),
            (interaction.member as GuildMember).nickname
              ? (interaction.member as GuildMember).nickname
              : interaction.user.username,
            issuer.nickname ? issuer.nickname : issuer.user.username,
            issuer.id,
            this.i18n,
            interaction.guildId,
          );
        } else {
          const dm = await issuer.createDM();
          const dmembed = new EmbedBuilder()
            .setColor(0xbd9f26)
            .setTitle(
              this.i18n.t('dm_ticket_close', {
                lng: configuredLang,
                ns: 'tickets',
              }),
            )
            .setDescription(
              this.i18n.t('dm_ticket_close_desc', {
                lng: configuredLang,
                ns: 'tickets',
                channel: interaction.channel.name,
                name: interaction.user,
              }),
            )
            .setFooter({
              iconURL:
                'https://cdn.discordapp.com/icons/691045202864898109/516a15b8c83eb141b027621b00afab18.webp?size=100',
              text: 'Powered by Alverrt#4727',
            });
          await dm.send({ embeds: [dmembed] });
          channelid = interaction.channel.id;
          closedbyid = interaction.user.id;
          await interaction.channel.delete();
        }

        await knex('discordtickets')
          .where(
            'ChannelId',
            interaction.channel.id ? interaction.channel.id : channelid,
          )
          .update({
            ClosedById: interaction.user.id ? interaction.user.id : closedbyid,
            ClosedAt: new Date(),
          });
      } else {
        await interaction.channel.send({
          content: 'ERROR! Internal server error.',
        });
      }
    } catch (error) {
      this.logger.error(error, error.stack);
      if (transcriptIncluded === 'true') {
        await this.transcriptsService.addNewTranscriptJob(
          result.SettingValue,
          interaction.channel.id,
          interaction.channel.name.toString(),
          (interaction.member as GuildMember).nickname
            ? (interaction.member as GuildMember).nickname
            : interaction.user.username,
          'unknown',
          'unknown',
          this.i18n,
          interaction.guildId,
        );
      }
    }
    return;
  }

  @Button('closewithreason')
  @UseInterceptors(ModerationInterceptor)
  async onCloseWithReason(@Context() [interaction]: ButtonContext) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const modal = new ModalBuilder()
      .setCustomId(`closewithreasonmodal/${interaction.channel.id}`)
      .setTitle(
        this.i18n.t('close_with_reason', {
          lng: configuredLang,
          ns: 'tickets',
          channel: interaction.channel.name,
          name: interaction.user,
        }),
      );

    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('sebep')
      .setPlaceholder(
        this.i18n.t('reason_desc', {
          lng: configuredLang,
          ns: 'tickets',
          channel: interaction.channel.name,
          name: interaction.user,
        }),
      )
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(0)
      .setMaxLength(1000)
      .setRequired(true);

    const reasonActionRow =
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        reasonInput,
      );

    modal.addComponents([reasonActionRow]);
    await interaction.showModal(modal);
  }

  @Modal('closewithreasonmodal/:channelid')
  public async onCloseTicketWithReasonModal(
    @Ctx() [interaction]: ModalContext,
    @ModalParam('channelid') channelid: string,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );

    const result = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_TRANSCRIPT_CHANNEL)
      .first();
    if (!result) {
      await interaction.reply(
        this.i18n.t('delete_ticket_no_transcript', {
          lng: configuredLang,
          ns: 'tickets',
        }),
      );
      await interaction.channel.delete();
      return;
    }
    const reasonInput = interaction.fields.getTextInputValue('reason');

    const resp = await knex('discordtickets')
      .where('ChannelId', interaction.channel.id)
      .first();

    const embed = this.utils.buildNewEmbed(
      this.i18n.t('dm_ticket_close_title', {
        lng: configuredLang,
        ns: 'tickets',
      }),
      this.i18n.t('dm_ticket_close_desc', {
        lng: configuredLang,
        ns: 'tickets',
      }),
    );
    await interaction.channel.send({ embeds: [embed] });
    await interaction.deferUpdate();
    try {
      if (resp) {
        const issuerId = resp.IssuerId;
        const issuer = await interaction.guild.members.fetch(issuerId);
        await this.transcriptsService.addNewTranscriptJob(
          result.SettingValue,
          interaction.channel.id,
          interaction.channel.name.toString(),
          (interaction.member as GuildMember).nickname
            ? (interaction.member as GuildMember).nickname
            : interaction.user.username,
          issuer.nickname ? issuer.nickname : issuer.user.username,
          issuer.id,
          this.i18n,
          interaction.guildId,
          reasonInput,
        );

        await knex('discordtickets')
          .where('ChannelId', interaction.channel.id)
          .update({ ClosedById: interaction.user.id, ClosedAt: new Date() });
      } else {
        await interaction.channel.send({
          content: 'ERROR! Internal server error.',
        });
      }
    } catch (error) {
      this.logger.error(error, error.stack);
      await this.transcriptsService.addNewTranscriptJob(
        result.SettingValue,
        interaction.channel.id,
        interaction.channel.name.toString(),
        (interaction.member as GuildMember).nickname
          ? (interaction.member as GuildMember).nickname
          : interaction.user.username,
        'unknown',
        'unknown',
        this.i18n,
        interaction.guildId,
      );
    }
    return;
  }
}
