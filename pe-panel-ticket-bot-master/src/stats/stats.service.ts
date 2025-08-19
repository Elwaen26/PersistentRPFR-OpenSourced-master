import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { EmbedBuilder, GuildMember } from 'discord.js';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { ModerationInterceptor } from 'src/interceptors/moderation.interceptor';
import { PrismaService } from 'src/prisma/prisma.service';
import { UtilsService } from 'src/utils/utils.service';
import { ManagerInterceptor } from '../interceptors/manager.interceptor';
import { StatsOfDto } from './dto/stats.dto';
import { ConfigEnums } from '../types/setup.types';
import { DBConnectionFactory } from 'src/factories/dbconnection.factory';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utils: UtilsService,
    private readonly dbConnFactory: DBConnectionFactory,
  ) {}

  @SlashCommand({
    name: 'statsme',
    description: 'You can view your own ticket stats.',
  })
  @UseInterceptors(ModerationInterceptor)
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    try {
      const knex = await this.dbConnFactory.retrieveConnection(
        interaction.guildId,
      );

      const closedCount = (
        await knex('discordtickets')
          .where('ClosedById', interaction.user.id)
          .count('* as count')
      )[0].count;
      const claimedCount = (
        await knex('discordtickets')
          .where('ClaimedBy', interaction.user.id)
          .count('* as count')
      )[0].count;

      const embed = new EmbedBuilder()
        .setTitle('Your Ticket Stats')
        .setFields([
          { name: 'Closed Ticket Count', value: closedCount.toString() },
          { name: 'Claimed Ticket Count', value: claimedCount.toString() },
        ])
        .setFooter({
          iconURL:
            'https://cdn.discordapp.com/icons/691045202864898109/516a15b8c83eb141b027621b00afab18.webp?size=100',
          text: 'Powered by Alverrt#4727',
        });
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    } catch (error) {
      this.logger.error(error, error.stack);
      await interaction.reply({
        content: 'Problem occured while processing your request.',
      });
    }
  }

  @SlashCommand({
    name: 'statsof',
    description: 'You can view other staff members ticket stats.',
  })
  @UseInterceptors(ManagerInterceptor)
  public async onCmdStatsOf(
    @Context() [interaction]: SlashCommandContext,
    @Options() { member }: StatsOfDto,
  ) {
    try {
      const knex = await this.dbConnFactory.retrieveConnection(
        interaction.guildId,
      );

      const staffRolesResult = await knex('discordconfig')
        .where('SettingName', ConfigEnums.TICKET_PANEL_STAFF_GROUPS)
        .first();
      if (!staffRolesResult) {
        await interaction.reply({
          content: 'Please set staff roles to use this command.',
          ephemeral: true,
        });
        return;
      }
      const staffRolesParsed = JSON.parse(staffRolesResult.SettingValue);
      const userIsStaffMember = (member as GuildMember).roles.cache.some(
        (item) => staffRolesParsed.includes(item.id),
      );
      if (!userIsStaffMember) {
        await interaction.reply({
          content: 'Selected user is not a member of staff.',
          ephemeral: true,
        });
        return;
      }

      const closedCount = (
        await knex('discordconfig')
          .where('ClosedById', member.user.id)
          .count('* as count')
      )[0].count;
      const claimedCount = (
        await knex('discordconfig')
          .where('ClaimedBy', member.user.id)
          .count('* as count')
      )[0].count;

      const embed = new EmbedBuilder()
        .setTitle(`Ticket Stats of ${member.displayName}`)
        .setFields([
          { name: 'Closed Ticket Count', value: closedCount.toString() },
          { name: 'Claimed Ticket Count', value: claimedCount.toString() },
        ])
        .setFooter({
          iconURL:
            'https://cdn.discordapp.com/icons/691045202864898109/516a15b8c83eb141b027621b00afab18.webp?size=100',
          text: 'Powered by Alverrt#4727',
        });
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    } catch (error) {
      this.logger.error(error, error.stack);
      await interaction.reply({
        content: 'Problem occured while processing your request.',
      });
    }
  }
}
