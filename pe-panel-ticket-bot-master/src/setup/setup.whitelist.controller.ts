import { Injectable } from '@nestjs/common';
import {
  Context,
  Button,
  ButtonContext,
  Ctx,
  Modal,
  ModalContext,
  ModalParam,
  SelectedStrings,
  StringSelect,
  StringSelectContext,
} from 'necord';
import { SETUP_ROUTES } from './setup.routes';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import Redis from 'ioredis';
import { InjectRedis } from 'src/redis/inject-redis.decorator';
import { UtilsService } from 'src/utils/utils.service';
import { InteractionBus } from 'src/interaction-bus/interaction.bus';
import { RedisKeys } from 'src/redis/redis.keys';
import { RedisWhitelistQuestion } from 'src/redis/redis.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { DBConnectionFactory } from 'src/factories/dbconnection.factory';
import { InjectI18n } from 'src/i18n/inject-i18n.decorator';
import { i18n } from 'i18next';

@Injectable()
export class SetupWhitelistController {
  constructor(
    private readonly utilsService: UtilsService,
    @InjectRedis() private readonly redisClient: Redis,
    @InjectI18n() private readonly i18n: i18n,
    private readonly interactionBus: InteractionBus,
    private readonly prismaService: PrismaService,
    private readonly dbConnFactory: DBConnectionFactory,
  ) {}

  @Button(SETUP_ROUTES.buttons.whitelistAddNewQuestion)
  public async onWhitelistAddNewQuestion(
    @Context() [interaction]: ButtonContext,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const modal = new ModalBuilder()
      .setCustomId(
        `${SETUP_ROUTES.modal.whitelistAddNewQuestion}/${interaction.id}`,
      )
      .setTitle(
        this.i18n.t('add_new_question', {
          lng: configuredLang,
          ns: 'whitelist',
        }),
      );
    const txtFields = [];
    txtFields.push(
      new TextInputBuilder()
        .setCustomId(SETUP_ROUTES.txtFields.whitelistAddNewQuestionTitle)
        .setLabel(
          this.i18n.t('title', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        )
        .setStyle(TextInputStyle.Short),
    );
    txtFields.push(
      new TextInputBuilder()
        .setCustomId(SETUP_ROUTES.txtFields.whitelistAddNewQuestionQuestion)
        .setLabel(
          this.i18n.t('question', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        )
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(255),
    );

    modal.addComponents(
      txtFields.map((item) =>
        new ActionRowBuilder<TextInputBuilder>().addComponents(item),
      ),
    );
    this.interactionBus.set(interaction);
    await interaction.showModal(modal);
    return;
  }

  @Button(SETUP_ROUTES.buttons.whitelistSaveQuestions)
  public async onWhitelistSaveQuestions(
    @Context() [interaction]: ButtonContext,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    await interaction.deferUpdate();
    await interaction.editReply({
      content: this.i18n.t('questions_updated_success', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
      embeds: [],
      components: [],
    });
    return;
  }

  @Button(SETUP_ROUTES.buttons.whitelistDeleteQuestion)
  public async onWhitelistRemoveQuestion(
    @Context() [interaction]: ButtonContext,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    await interaction.deferUpdate();
    // if there is already selectmenu attached
    if (interaction.message.components.length > 1) {
      return;
    }
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );
    const questions = await knex().select('*').from('whitelistQuestions');
    if (questions) {
      const questionSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(SETUP_ROUTES.selectmenus.whitelistDeleteQuestion)
        .setPlaceholder(
          this.i18n.t('select_question', {
            lng: configuredLang,
            ns: 'whitelist',
          }),
        )
        .addOptions(
          questions.map((item, index) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(
                item.Title.length > 32
                  ? `${item.Title.substring(0, 3)}...`
                  : item.Title,
              )
              .setValue(item.Id.toString()),
          ),
        )
        .setMaxValues(1);
      const addQuestionButton = new ButtonBuilder()
        .setCustomId(`${SETUP_ROUTES.buttons.whitelistAddNewQuestion}`)
        .setLabel(
          this.i18n.t('add_question', {
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
      const actionRowButtons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(addQuestionButton)
        .addComponents(removeQuestionButton)
        .addComponents(saveQuestionButton);
      const actionRowSelectmenu =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          questionSelectMenu,
        );
      this.interactionBus.set(interaction);
      await interaction.editReply({
        components: [actionRowButtons, actionRowSelectmenu],
      });
      return;
    }
  }

  @Modal(`${SETUP_ROUTES.modal.whitelistAddNewQuestion}/:interactionId`)
  public async onWhitelistAddQuestionModal(
    @Ctx() [interaction]: ModalContext,
    @ModalParam('interactionId') interactionId: string,
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );
    const title = interaction.fields.getTextInputValue(
      SETUP_ROUTES.txtFields.whitelistAddNewQuestionTitle,
    );
    const question = interaction.fields.getTextInputValue(
      SETUP_ROUTES.txtFields.whitelistAddNewQuestionQuestion,
    );
    await knex('whitelistQuestions').insert({
      Question: question,
      Title: title,
    });
    const questions = await knex().select().from('whitelistQuestions');
    let embedDesc =
      this.i18n.t('here_whitelist_questions', {
        lng: configuredLang,
        ns: 'whitelist',
      }) + ':\n\n';
    if (questions) {
      questions.forEach((item) => {
        embedDesc += `${this.i18n.t('title', {
          lng: configuredLang,
          ns: 'whitelist',
        })}: ${item.Title}\n`;
        embedDesc += `${this.i18n.t('question', {
          lng: configuredLang,
          ns: 'whitelist',
        })}: ${item.Title}\n\n`;
      });
    } else {
      embedDesc += `${this.i18n.t('title', {
        lng: configuredLang,
        ns: 'whitelist',
      })}: ${title}\n`;
      embedDesc += `${this.i18n.t('question', {
        lng: configuredLang,
        ns: 'whitelist',
      })}: ${question}\n\n`;
    }
    const embed = this.utilsService.buildNewEmbed(
      this.i18n.t('whitelist_questions', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
      embedDesc,
    );
    const baseInteraction = this.interactionBus.get(interactionId);
    await interaction.deferUpdate();
    await baseInteraction.interaction.editReply({ embeds: [embed] });
    return;
  }

  @StringSelect(SETUP_ROUTES.selectmenus.whitelistDeleteQuestion)
  public async onQuestionDeleteSelectmenu(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() selected: string[],
  ) {
    const configuredLang =
      (await this.redisClient.get(
        `${interaction.guildId}:${RedisKeys.BotLanguage}`,
      )) || 'en';
    await interaction.deferUpdate();
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );
    let embedDesc =
      this.i18n.t('here_whitelist_questions', {
        lng: configuredLang,
        ns: 'whitelist',
      }) + ': \n\n';
    await knex('whitelistQuestions')
      .where('Id', parseInt(selected[0]))
      .delete();

    const questions = await knex().select().from('whitelistQuestions');

    questions.forEach((item) => {
      embedDesc += `${this.i18n.t('title', {
        lng: configuredLang,
        ns: 'whitelist',
      })}: ${item.Title}\n`;
      embedDesc += `${this.i18n.t('question', {
        lng: configuredLang,
        ns: 'whitelist',
      })}: ${item.Question}\n\n`;
    });
    const embed = this.utilsService.buildNewEmbed(
      this.i18n.t('whitelist_questions', {
        lng: configuredLang,
        ns: 'whitelist',
      }),
      embedDesc,
    );
    const addQuestionButton = new ButtonBuilder()
      .setCustomId(`${SETUP_ROUTES.buttons.whitelistAddNewQuestion}`)
      .setLabel(
        this.i18n.t('add_question', {
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
    const actionRowButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(addQuestionButton)
      .addComponents(removeQuestionButton)
      .addComponents(saveQuestionButton);
    await interaction.editReply({
      embeds: [embed],
      components: [actionRowButtons],
    });
    return;
  }
}
