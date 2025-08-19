import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  TextChannel,
} from 'discord.js';
import { CreateModlogMessageDto } from './dto/events.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigEnums } from '../types/setup.types';
import { UtilsService } from '../utils/utils.service';
import { DBConnectionFactory } from 'src/factories/dbconnection.factory';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utils: UtilsService,
    private readonly dbConnFactory: DBConnectionFactory,
  ) {}
  async createModlogMessage(dto: CreateModlogMessageDto) {
    try {
      console.log("Here")

      const knex = await this.dbConnFactory.retrieveConnection(dto.guildId);
      console.log("Here")
      const result = await knex('discordconfig')
        .where('SettingName', ConfigEnums.TICKET_MODLOG_CHANNEL)
        .first();
      console.log("Here2")
      if (result) {
        const modlogChannelId = result.SettingValue;
        if (modlogChannelId.length > 0) {
          const client = new Client({ intents: [GatewayIntentBits.Guilds] });
          await client.login(process.env.DISCORD_TOKEN);
          const modlogChannel = (await client.channels.fetch(
            modlogChannelId,
          )) as TextChannel;

          const playersresult = await knex('players')
            .where('PlayerId', dto.punishedId)
            .first();
          let user = null;
          try {
            user = await client.users.fetch(playersresult.DiscordId);
          } catch (error) {
            if (playersresult.DiscordId) {
              this.logger.error(
                'Cant find the user with the id of: ' + playersresult.DiscordId,
              );
            }
          }
          const embed = new EmbedBuilder()
            .setTitle('New Modlog')
            .setDescription(
              'New punishment created at modlog. You can view the ticket transcript (if provided) by clicking the button below.',
            )
            .setFields([
              { name: 'Admin Name', value: dto.punisherName },
              { name: 'Punished Player Name', value: playersresult.Name },
              { name: 'Punishment Type', value: dto.punishmentType },
              {
                name: 'Punishment Duration',
                value: this.parseMinutes(parseInt(dto.punishmentDuration)),
              },
              { name: 'Reason', value: dto.reason },
            ])
            .setFooter({
              iconURL:
                'https://cdn.discordapp.com/icons/691045202864898109/516a15b8c83eb141b027621b00afab18.webp?size=100',
              text: 'Powered by Alverrt#4727',
            });
          let transcriptButton: ActionRowBuilder<ButtonBuilder> | null = null;
          if (dto.url.length > 0) {
            transcriptButton =
              new ActionRowBuilder<ButtonBuilder>().addComponents([
                new ButtonBuilder()
                  .setLabel('View Transcript')
                  .setStyle(ButtonStyle.Link)
                  .setURL(dto.url),
              ]);
          }
          await modlogChannel.send({
            ...(user && {
              content: `We have found the punished players discord account. So I am pinging him for notification: ${user}`,
            }),
            embeds: [embed],
            ...(transcriptButton && { components: [transcriptButton] }),
          });
        }
      }
    } catch (error) {
      this.logger.error(error, error.stack);
      if (error.code === 10003) {
        throw new NotFoundException('There is no modlog channel set.');
      }
      throw new InternalServerErrorException();
    }
  }

  parseMinutes(durationMinutes: number) {
    const MINUTESSEC = 60;
    const HOURSSEC = MINUTESSEC * 60;
    const DAYSSEC = HOURSSEC * 24;

    if (durationMinutes > (90 * DAYSSEC) / 60) {
      return 'PERMANENT';
    }

    const totalSeconds = durationMinutes * 60;
    if (totalSeconds < 0) {
      return `Unbanned`;
    }
    const days =
      Math.floor(totalSeconds / DAYSSEC) > 0
        ? Math.floor(totalSeconds / DAYSSEC)
        : 0;
    const hours =
      Math.floor(totalSeconds / HOURSSEC) > 0
        ? Math.floor((totalSeconds - days * DAYSSEC) / HOURSSEC)
        : 0;

    const minutes =
      Math.floor(totalSeconds / MINUTESSEC) > 0
        ? Math.floor(
            (totalSeconds - (hours * HOURSSEC + days * DAYSSEC)) / MINUTESSEC,
          )
        : 0;

    return `${days} day, ${hours} hours, ${minutes} mins`;
  }
}
