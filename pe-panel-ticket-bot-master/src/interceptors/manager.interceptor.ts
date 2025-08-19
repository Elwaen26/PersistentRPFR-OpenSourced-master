import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  GuildMember,
  PermissionFlagsBits,
} from 'discord.js';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigEnums } from 'src/types/setup.types';
import { PrismaService } from '../prisma/prisma.service';
import { DBConnectionFactory } from 'src/factories/dbconnection.factory';

@Injectable()
export class ManagerInterceptor implements NestInterceptor {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly dbConnFactory: DBConnectionFactory,
  ) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const interaction = context.getArgs()[0][0] as ChatInputCommandInteraction;
    const knex = await this.dbConnFactory.retrieveConnection(
      interaction.guildId,
    );

    const managerGroups = await knex('discordconfig')
      .where('SettingName', ConfigEnums.TICKET_PANEL_MANAGER_GROUPS)
      .first();
    if (!managerGroups) {
      await interaction.reply({
        content: 'You have no permission to that action. (no manager role set)',
        ephemeral: true,
      });
      return;
    }
    const parsedManagerGroups = JSON.parse(
      managerGroups.SettingValue,
    ) as string[];

    const userIsStaffMember = (
      interaction.member as GuildMember
    ).roles.cache.some((item) => parsedManagerGroups.includes(item.id));

    if (
      userIsStaffMember ||
      interaction.memberPermissions.has(PermissionFlagsBits.Administrator)
    ) {
      return next.handle();
    } else {
      await interaction.reply({
        content: 'You have no permission to that action.',
        ephemeral: true,
      });
      return;
    }
  }
}
