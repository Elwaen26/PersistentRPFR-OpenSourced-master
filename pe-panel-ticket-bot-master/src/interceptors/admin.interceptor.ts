import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminInterceptor implements NestInterceptor {
  constructor(private readonly prismaService: PrismaService) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const interaction = context.getArgs()[0][0] as ChatInputCommandInteraction;
    const userIsGuildAdministrator = interaction.memberPermissions.has(
      PermissionFlagsBits.Administrator,
    );

    if (userIsGuildAdministrator) {
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
