import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
  GuildMemberRoleManager,
  PermissionFlagsBits,
} from 'discord.js';
import { Button, Context, ButtonContext, ComponentParam } from 'necord';
import { PrismaService } from 'src/prisma/prisma.service';
import { TicketsService } from 'src/tickets/tickets.service';
import { ConfigEnums } from 'src/types/setup.types';
import { UtilsService } from 'src/utils/utils.service';
import { ModerationInterceptor } from '../interceptors/moderation.interceptor';
import { DBConnectionFactory } from 'src/factories/dbconnection.factory';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(TicketsService.name);
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly utils: UtilsService,
    private readonly dbConnFactory: DBConnectionFactory,
  ) {}
  @Button('claimticket')
  public async onButtonClaim(@Context() [interaction]: ButtonContext) {
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );

    const staffresult = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_PANEL_STAFF_GROUPS)
      .first();

    const staff = JSON.parse(staffresult.SettingValue) as string[];
    const isPermissioned = (
      interaction.member.roles as GuildMemberRoleManager
    ).cache.hasAny(...staff);
    if (
      !isPermissioned &&
      !interaction.memberPermissions.any(PermissionFlagsBits.Administrator)
    ) {
      interaction.reply({
        content: 'Only staff members can claim tickets.',
        ephemeral: true,
      });
      setTimeout(() => {
        interaction.deleteReply();
      }, 3000);
      return;
    }
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents([
      new ButtonBuilder()
        .setCustomId(`claimticketapprove/${interaction.user.id}`)
        .setLabel('Yes')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`claimticketdismiss/${interaction.user.id}`)
        .setLabel('No')
        .setStyle(ButtonStyle.Secondary),
    ]);

    const embed = new EmbedBuilder()
      .setColor(0xbd9f26)
      .setTitle(`Ticket Claim Approve`)
      .setDescription(`${interaction.user} are you sure to claim the ticket?`)
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
  }

  @Button('claimticketdismiss/:value')
  public async onButtonClaimTicketDismiss(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('value') value: string,
  ) {
    if (interaction.user.id !== value) {
      await interaction.deferUpdate();
      return;
    }
    if (interaction.message.deletable) {
      await interaction.message.delete();
    } else {
      this.logger.debug('not deletable');
    }
  }

  @Button('claimticketapprove/:value')
  public async onButtonClaimTicketApprove(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('value') value: string,
  ) {
    if (interaction.user.id !== value) {
      await interaction.deferUpdate();
      return;
    }
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );

    const msg = await knex('discordtickets')
      .where('ChannelId', interaction.channel.id)
      .first();
    const embed = this.utils.buildNewEmbed(
      'Ticket Claimed',
      `Ticket claimed by ${interaction.user}.`,
    );

    await interaction.channel.edit({
      name: `t-${msg.TicketID}-${(
        interaction.member as GuildMember
      ).displayName.trim()}`,
    });

    await interaction.channel.send({
      embeds: [embed],
      content: `Ticket claimed by ${interaction.user}.`,
    });

    await knex('discordtickets')
      .where('ChannelId', interaction.channel.id)
      .update({ ClaimedBy: interaction.user.id });
    if (interaction.message.deletable) {
      await interaction.message.delete();
      await interaction.channel.messages.cache.get(msg.MessageId).edit({
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder()
              .setCustomId('closeticket')
              .setEmoji('⚠️')
              .setLabel('Close Ticket')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('closewithreason')
              .setEmoji('📤')
              .setLabel('Close With Reason')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('unclaimticket')
              .setEmoji('🙌')
              .setLabel('Unclaim Ticket')
              .setStyle(ButtonStyle.Success),
          ]),
        ],
      });
    } else {
      this.logger.debug('not deletable');
    }
  }

  @Button('unclaimticket')
  @UseInterceptors(ModerationInterceptor)
  public async onButtonUnclaim(@Context() [interaction]: ButtonContext) {
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents([
      new ButtonBuilder()
        .setCustomId(`unclaimticketapprove/${interaction.user.id}`)
        .setLabel('Yes')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`unclaimticketdismiss/${interaction.user.id}`)
        .setLabel('No')
        .setStyle(ButtonStyle.Secondary),
    ]);

    const embed = new EmbedBuilder()
      .setColor(0xbd9f26)
      .setTitle(`Ticket Unclaim Approve`)
      .setDescription(`${interaction.user} are you sure to unclaim the ticket?`)
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
  }

  @Button('unclaimticketdismiss/:value')
  public async onButtonUnclaimTicketDismiss(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('value') value: string,
  ) {
    if (interaction.user.id !== value) {
      await interaction.deferUpdate();
      return;
    }

    if (interaction.message.deletable) {
      await interaction.message.delete();
    } else {
      this.logger.debug('not deletable');
    }
  }

  @Button('unclaimticketapprove/:value')
  public async onButtonUnclaimTicketApprove(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('value') value: string,
  ) {
    if (interaction.user.id !== value) {
      await interaction.deferUpdate();
      return;
    }
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );

    const msg = await knex('discordtickets')
      .where('ChannelId', interaction.channel.id)
      .first();

    await interaction.channel.edit({ name: `ticket-${msg.TicketID}` });
    const embed = this.utils.buildNewEmbed(
      'Ticket Unclaimed',
      `Ticket unclaimed by ${interaction.user}.`,
    );
    await interaction.channel.send({
      embeds: [embed],
      content: `Ticket unclaimed by ${interaction.user}.`,
    });

    await knex('discordtickets')
      .where('ChannelId', interaction.channel.id)
      .update({ ClaimedBy: '' });
    if (interaction.message.deletable) {
      await interaction.message.delete();
      await interaction.channel.messages.cache.get(msg.MessageId).edit({
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder()
              .setCustomId('closeticket')
              .setEmoji('⚠️')
              .setLabel('Close Ticket')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('closewithreason')
              .setEmoji('📤')
              .setLabel('Close With Reason')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('claimticket')
              .setEmoji('👋')
              .setLabel('Claim Ticket')
              .setStyle(ButtonStyle.Success),
          ]),
        ],
      });
    } else {
      this.logger.debug('not deletable');
    }
  }
}
