import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import {
  Button,
  Context,
  ButtonContext,
  ComponentParam,
  Ctx,
  Modal,
  ModalContext,
  ModalParam,
} from 'necord';
import { InteractionBus } from 'src/interaction-bus/interaction.bus';
import { InjectRedis } from 'src/redis/inject-redis.decorator';
import { SETUP_ROUTES } from 'src/setup/setup.routes';
import { UtilsService } from 'src/utils/utils.service';
import { WHITELIST_ROUTES } from './whitelist.routes';
import { RedisKeys } from 'src/redis/redis.keys';
import { RedisWhitelistQuestion } from 'src/redis/redis.types';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ForumChannel,
  GuildMember,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ThreadChannel,
  userMention,
} from 'discord.js';
import { PrismaService } from 'src/prisma/prisma.service';
import { DBConnectionFactory } from 'src/factories/dbconnection.factory';
import { InjectI18n } from 'src/i18n/inject-i18n.decorator';
import { i18n } from 'i18next';

@Injectable()
export class WhitelistController {
  constructor(
    private readonly utilsService: UtilsService,
    @InjectRedis() private readonly redisClient: Redis,
    private readonly interactionBus: InteractionBus,
    private readonly prismaService: PrismaService,
    private readonly dbConnFactory: DBConnectionFactory,
    @InjectI18n() private readonly i18n: i18n,
  ) {}

  @Button(`${WHITELIST_ROUTES.button.startAnswering}`)
  public async onWhitelistStartAnswering(
    @Context() [interaction]: ButtonContext,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );

    const isUserAlreadySubmitAForm: any = await knex('whitelistAnswers')
      .where('DiscordId', interaction.user.id)
      .count('* as count');
    if (isUserAlreadySubmitAForm[0].count > 0) {
      await interaction.reply({
        content: this.i18n.t('only_once_fill', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
        ephemeral: true,
      });
      return;
    }

    const userSteamIdExist = await knex('steamdiscordpairs')
      .where('DiscordId', interaction.user.id)
      .first();
    if (!userSteamIdExist) {
      const modal = new ModalBuilder()
        .setCustomId(`${WHITELIST_ROUTES.modal.provideSteamId}`)
        .setTitle(
          this.i18n.t('connect_steam', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        );
      const txtField = new TextInputBuilder()
        .setCustomId(WHITELIST_ROUTES.txtField.steamIdTextInput)
        .setLabel(
          this.i18n.t('type_steam_id', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        )
        .setPlaceholder(
          this.i18n.t('steam_id_placeholder', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        )
        .setMaxLength(255)
        .setStyle(TextInputStyle.Paragraph);
      const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
        txtField,
      );
      modal.addComponents(actionRow);
      await interaction.showModal(modal);
      return;
    }

    const userAlreadyProvidedCustomName = await knex('players')
      .where('PlayerId', userSteamIdExist.SteamId)
      .first();
    if (
      !userAlreadyProvidedCustomName ||
      !userAlreadyProvidedCustomName.CustomName 
    ) {
      const modal = new ModalBuilder()
        .setCustomId(`${WHITELIST_ROUTES.modal.provideInGameName}`)
        .setTitle(
          this.i18n.t('provide_ingame_name_title', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        );
      const txtField = new TextInputBuilder()
        .setCustomId(WHITELIST_ROUTES.txtField.ingameNameTextInput)
        .setLabel(
          this.i18n.t('provide_ingame_name_label', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        )
        .setPlaceholder(
          this.i18n.t('provide_ingame_name_placeholder', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        )
        .setMaxLength(50)
        .setStyle(TextInputStyle.Paragraph);
      const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
        txtField,
      );
      modal.addComponents(actionRow);
      await interaction.showModal(modal);
      return;
    }

    const rawQuestions = await knex('whitelistQuestions').select();
    const embed = this.utilsService.buildNewEmbed(
      rawQuestions[0].Title,
      rawQuestions[0].Question,
    );
    const button = new ButtonBuilder()
      .setCustomId(`${WHITELIST_ROUTES.button.answerTheQuestion}/0`)
      .setStyle(ButtonStyle.Primary)
      .setLabel(
        this.i18n.t('answer', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      );
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      button,
    );
    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
      ephemeral: true,
    });
    return;
  }

  @Button(`${WHITELIST_ROUTES.button.answerTheQuestion}/:questionIndex`)
  public async onWhitelistAnswerQuestion(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('questionIndex') questionIndex: string,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const modal = new ModalBuilder()
      .setCustomId(
        `${WHITELIST_ROUTES.modal.submitAnswerModal}/${questionIndex}/interaction/${interaction.id}`,
      )
      .setTitle(
        this.i18n.t('answer', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      );
    const txtField = new TextInputBuilder()
      .setCustomId(WHITELIST_ROUTES.txtField.answerTextInput)
      .setLabel(
        this.i18n.t('answer', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      )
      .setPlaceholder(
        this.i18n.t('answer_placeholder', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      )
      .setMaxLength(2000)
      .setStyle(TextInputStyle.Paragraph);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      txtField,
    );
    this.interactionBus.set(interaction);
    modal.addComponents(actionRow);
    await interaction.showModal(modal);
    return;
  }

  @Modal(
    `${WHITELIST_ROUTES.modal.submitAnswerModal}/:questionIndex/interaction/:interactionId`,
  )
  public async onWhitelistAddAnswerModal(
    @Ctx() [interaction]: ModalContext,
    @ModalParam('questionIndex') questionIndex: string,
    @ModalParam('interactionId') interactionId: string,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const answer = interaction.fields.getTextInputValue(
      WHITELIST_ROUTES.txtField.answerTextInput,
    );
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );
    const baseInteraction = this.interactionBus.get(interactionId);

    const questions = await knex('whitelistQuestions').select();
    const parsedQuestionIndex = parseInt(questionIndex);

    await knex('whitelistAnswers').insert({
      DiscordId: interaction.user.id,
      Answer: answer,
      whitelistQuestionsId: questions[parsedQuestionIndex].Id,
    });
    if (
      parsedQuestionIndex < questions.length &&
      parsedQuestionIndex + 1 !== questions.length
    ) {
      const embed = this.utilsService.buildNewEmbed(
        questions[parsedQuestionIndex + 1].Title,
        questions[parsedQuestionIndex + 1].Question,
      );
      const button = new ButtonBuilder()
        .setCustomId(
          `${WHITELIST_ROUTES.button.answerTheQuestion}/${
            parsedQuestionIndex + 1
          }}`,
        )
        .setStyle(ButtonStyle.Primary)
        .setLabel(
          this.i18n.t('answer', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        );
      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        button,
      );
      await interaction.deferUpdate();
      await baseInteraction.interaction.editReply({
        embeds: [embed],
        components: [actionRow],
      });
    } else {
      const embed = this.utilsService.buildNewEmbed(
        this.i18n.t('form_sent', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
        this.i18n.t('form_sent_desc', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      );
      await interaction.deferUpdate();
      await baseInteraction.interaction.editReply({
        embeds: [embed],
        components: [],
      });
      const allAnswers = await knex('whitelistAnswers')
        .select('*')
        .where('DiscordId', interaction.user.id)
        .innerJoin(
          'whitelistQuestions',
          'whitelistAnswers.whitelistQuestionsId',
          'whitelistQuestions.Id',
        );
      const transcriptForumId = await this.redisClient.get(
        `${interaction.guild.id}:${RedisKeys.WhitelistForumId}`,
      );
      let wlApplication = '';
      wlApplication += `${this.i18n.t('application_made_by', {
        lng: configuredLang,
        ns: 'whitelist',
        name: (interaction.member as GuildMember).displayName,
      })} ${userMention(interaction.user.id)}\n\n`;
      allAnswers.forEach((item) => {
        wlApplication += `${item.Title}:\n`;
        wlApplication += `${item.Answer}\n\n`;
      });
      const transcriptForum = (await interaction.guild.channels.fetch(
        transcriptForumId,
      )) as ForumChannel;
      const wlembed = this.utilsService.buildNewEmbed(
        this.i18n.t('form_application_title', {
          lng: configuredLang,
          ns: 'whitelist',
          name: (interaction.member as GuildMember).displayName,
        }),
        wlApplication,
      );
      const acceptButton = new ButtonBuilder()
        .setCustomId(
          `${WHITELIST_ROUTES.button.acceptUserApplication}/${interaction.user.id}`,
        )
        .setStyle(ButtonStyle.Success)
        .setLabel(
          this.i18n.t('accept', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        );
      const rejectButton = new ButtonBuilder()
        .setCustomId(
          `${WHITELIST_ROUTES.button.rejectUserApplication}/${interaction.user.id}/mode/normal`,
        )
        .setStyle(ButtonStyle.Danger)
        .setLabel(
          this.i18n.t('reject', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        );

      const softRejectButton = new ButtonBuilder()
        .setCustomId(
          `${WHITELIST_ROUTES.button.rejectUserApplication}/${interaction.user.id}/mode/soft`,
        )
        .setStyle(ButtonStyle.Danger)
        .setLabel(
          this.i18n.t('soft_reject', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        );
      const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(acceptButton)
        .addComponents(rejectButton)
        .addComponents(softRejectButton);
      await transcriptForum.threads.create({
        name: this.i18n.t('pending_status_form_title', {
          lng: configuredLang,
          ns: 'whitelist',
          name: (interaction.member as GuildMember).displayName,
        }),
        message: { embeds: [wlembed], components: [actionRow] },
      });
    }
    return;
  }

  @Button(`${WHITELIST_ROUTES.button.acceptUserApplication}/:userDiscordId`)
  public async onWhitelistAcceptUserApplication(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('userDiscordId') userDiscordId: string,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );
    await interaction.deferUpdate();
    await interaction.editReply({ components: [] });
    const embed = this.utilsService.buildNewEmbed(
      this.i18n.t('application_accepted', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
      this.i18n.t('application_accepted_by', {
        lng: configuredLang,
        ns: 'whitelist',
        name: (interaction.member as GuildMember).displayName,
      }),
    );
    const acceptedUser = await interaction.guild.members.fetch(userDiscordId);
    const member = await interaction.guild.members.fetch(userDiscordId);
    await (interaction.channel as ThreadChannel).edit({
      name: this.i18n.t('accepted_status_form_title', {
        lng: configuredLang,
        ns: 'whitelist',
        name: (member as GuildMember).displayName,
      }),
    });
    await interaction.channel.send({ embeds: [embed] });

    const steamId = await knex('steamdiscordpairs')
      .where('DiscordId', userDiscordId)
      .first();

    await knex('whitelist')
      .insert({
        PlayerId: steamId.SteamId,
      })
      .onConflict('PlayerId')
      .merge();
    const dmembed = this.utilsService.buildNewEmbed(
      this.i18n.t('application_accepted_dm_title', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
      this.i18n.t('application_accepted_dm_desc', {
        lng: configuredLang,
        ns: 'whitelist',
        serverName: interaction.guild.name,
      }),
    );
    const dm = await acceptedUser.createDM();
    await dm.send({ embeds: [dmembed] });
    return;
  }

  @Button(
    `${WHITELIST_ROUTES.button.rejectUserApplication}/:userDiscordId/mode/:rejectionMode`,
  )
  public async onWhitelistRejectUserApplication(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('userDiscordId') userDiscordId: string,
    @ComponentParam('rejectionMode') rejectionMode: 'soft' | 'normal',
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const modal = new ModalBuilder()
      .setCustomId(
        `${WHITELIST_ROUTES.modal.wlrejectionReason}/${userDiscordId}/mode/${rejectionMode}/interaction/${interaction.id}`,
      )
      .setTitle(
        this.i18n.t('whitelist_rejection_reason_modal_title', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      );
    const txtField = new TextInputBuilder()
      .setCustomId(WHITELIST_ROUTES.txtField.wlRejectionTextInput)
      .setLabel(
        this.i18n.t('whitelist_rejection_reason_modal_label', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      )
      .setPlaceholder(
        this.i18n.t('whitelist_rejection_reason_modal_placeholder', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      )
      .setMaxLength(600)
      .setStyle(TextInputStyle.Paragraph);
    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      txtField,
    );
    this.interactionBus.set(interaction);
    modal.addComponents(actionRow);
    await interaction.showModal(modal);
    return;
  }

  @Modal(
    `${WHITELIST_ROUTES.modal.wlrejectionReason}/:userDiscordId/mode/:rejectionMode/interaction/:interactionId`,
  )
  public async onWhitelistRejectionReason(
    @Ctx() [interaction]: ModalContext,
    @ModalParam('userDiscordId') userDiscordId: string,
    @ModalParam('rejectionMode') rejectionMode: 'soft' | 'normal',
    @ModalParam('interactionId') interactionId: string,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );
    const baseInteraction = this.interactionBus.get(interactionId);

    const reason = interaction.fields.getTextInputValue(
      WHITELIST_ROUTES.txtField.wlRejectionTextInput,
    );
    await interaction.deferUpdate();
    await baseInteraction.interaction.editReply({ components: [] });
    const embed = this.utilsService.buildNewEmbed(
      this.i18n.t('application_rejected', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
      this.i18n.t('application_rejected_by', {
        lng: configuredLang,
        ns: 'whitelist',
        name: (interaction.member as GuildMember).displayName,
      }) +
        ` ${userMention(interaction.user.id)}` +
        `\n\nReason: ${reason.length > 0 ? reason : '-'}`,
    );
    const rejectedUser = await interaction.guild.members.fetch(userDiscordId);
    await (interaction.channel as ThreadChannel).edit({
      name: this.i18n.t('rejected_status_form_title', {
        lng: configuredLang,
        ns: 'whitelist',
        name: (interaction.member as GuildMember).displayName,
      }),
    });
    await interaction.channel.send({ embeds: [embed] });

    if (rejectionMode === 'soft') {
      await knex('whitelistanswers').where('DiscordId', userDiscordId).delete();
    }
    const steamId = await knex('steamdiscordpairs')
      .where('DiscordId', userDiscordId)
      .first();
    knex('whitelist')
      .insert({
        PlayerId: steamId.SteamId,
        Active: false,
      })
      .onConflict('PlayerId')
      .merge();
    const dmembed = this.utilsService.buildNewEmbed(
      this.i18n.t('application_rejected_dm_title', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
      this.i18n.t('application_rejected_dm_desc', {
        lng: configuredLang,
        ns: 'whitelist',
        serverName: interaction.guild.name,
      }) + `\n\nReason: ${reason.length > 0 ? reason : '-'}`,
    );
    const dm = await rejectedUser.createDM();
    await dm.send({ embeds: [dmembed] });
    return;
  }

  @Modal(`${WHITELIST_ROUTES.modal.provideSteamId}`)
  public async onSteamDiscordPairs(@Ctx() [interaction]: ModalContext) {
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );
    const steamid = interaction.fields.getTextInputValue(
      WHITELIST_ROUTES.txtField.steamIdTextInput,
    );
    await interaction.deferUpdate();

    await knex('steamdiscordpairs').insert({
      DiscordId: interaction.user.id,
      SteamId: steamid,
    });
    return;
  }

  @Modal(`${WHITELIST_ROUTES.modal.provideInGameName}`)
  public async onCustomInGameNameProvide(@Ctx() [interaction]: ModalContext) {
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );
    const ingameName = interaction.fields.getTextInputValue(
      WHITELIST_ROUTES.txtField.ingameNameTextInput,
    );
    await interaction.deferUpdate();

    const steamId = await knex('steamdiscordpairs')
      .where('DiscordId', interaction.user.id)
      .first();

    await knex('players')
      .insert({
        PlayerId: steamId.SteamId,
        Name: 'Bob',
        CustomName: ingameName,
        DiscordId: interaction.user.id,
      })
      .onConflict('PlayerId')
      .merge();

    return;
  }
}
