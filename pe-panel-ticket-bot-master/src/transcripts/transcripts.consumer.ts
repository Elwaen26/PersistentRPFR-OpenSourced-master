import { Job, DoneCallback } from 'bull';
import {
  ActionRowBuilder,
  AttachmentPayload,
  BufferResolvable,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  ForumChannel,
  GatewayIntentBits,
  GuildTextBasedChannel,
  Message,
  TextBasedChannel,
  ThreadAutoArchiveDuration,
} from 'discord.js';
import { i18n } from 'i18next';
import { Redis } from 'ioredis';
import internal from 'stream';

interface Payload {
  forumid: string;
  channelid: string;
  ticketNumber: string;
  issuerName: string;
  closedBy: string;
  issuerId: string;
  reason: string;
  i18n: i18n;
}

export default async function (job: Job<Payload>, cb: DoneCallback) {
  try {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    await client.login(process.env.DISCORD_TOKEN);
    const forum = (await client.channels.fetch(
      job.data.forumid,
    )) as ForumChannel;

    const channel = (await client.channels.fetch(job.data.channelid, {
      allowUnknownGuild: true,
    })) as GuildTextBasedChannel;
    const sumMessages = [];
    let last_id;
    while (true) {
      const options = { limit: 100, force: true };
      if (last_id) {
        options['before'] = last_id;
      }
      const msg = await channel.messages.fetch(options);
      last_id = msg.last().id;
      const arr = Array.from(msg.values());
      sumMessages.push(...arr);
      if (msg.size !== 100) {
        break;
      }
    }
    const msgraw = sumMessages;
    const reversed = msgraw.reverse();
    let transcript = '';
    const attachments: AttachmentPayload[] = [];
    reversed.forEach((item: Message) => {
      if (item.content) {
        transcript += `[${item.createdAt.toTimeString().split(' ')[0]}] [${
          item.author
        }] - ${item.content}\n`;
      }
      if (item.attachments.size > 0) {
        for (const attachment of item.attachments) {
          if (
            attachment[1].contentType &&
            attachment[1].contentType.startsWith('image')
          ) {
            attachments.push({
              name: attachment[1].name,
              attachment: attachment[1].url,
            });
            transcript += `[${item.author}]: [Attachment: ${attachment[1].name}]\n`;
          }
        }
      }
    });
    const embeddedMessages = reversed.at(0).embeds;
    const thread = await forum.threads.create({
      name: `[${job.data.ticketNumber}] - [${job.data.issuerName}]`,
      message: {
        content: 'Transcript created by PE Management Tool.',
        embeds: embeddedMessages,
      },
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
    });
    await thread.setLocked(true);
    const totalEmbedCountToBeUsed = Math.floor(transcript.length / 3500);
    console.log(
      `ticket number: ${job.data.ticketNumber}, messages count: ${reversed.length}`,
    );
    const transcriptParts = [];
    for (let index = 0; index <= totalEmbedCountToBeUsed; index++) {
      transcriptParts.push(
        transcript.substring(index * 3500, (index + 1) * 3500),
      );
    }
    const embed = transcriptParts.map((item) =>
      new EmbedBuilder()
        .setColor(0xbd9f26)
        .setTitle(
          `Transcript for [${
            job.data.ticketNumber
          }] Created at: ${new Date().toUTCString()}`,
        )
        .setFields([
          { name: 'Opened By', value: job.data.issuerName, inline: true },
          { name: 'Closed By', value: job.data.closedBy, inline: true },
        ])
        .setDescription(item)
        .setFooter({
          iconURL:
            'https://cdn.discordapp.com/icons/691045202864898109/516a15b8c83eb141b027621b00afab18.webp?size=100',
          text: 'Powered by Alverrt#4727',
        }),
    );

    for (const iterator of embed) {
      await thread.send({ embeds: [iterator] });
    }
    if (job.data.reason.length > 0) {
      const reasonEmbed = new EmbedBuilder()
        .setColor(0xbd9f26)
        .setTitle('Close Reason')
        .setDescription(job.data.reason)
        .setFooter({
          iconURL:
            'https://cdn.discordapp.com/icons/691045202864898109/516a15b8c83eb141b027621b00afab18.webp?size=100',
          text: 'Powered by Alverrt#4727',
        });
      await thread.send({ embeds: [reasonEmbed] });
    }
    for (const attachment of attachments) {
      await thread.send({
        content: `[Attachment Name: ${attachment.name}]`,
        files: [attachment],
      });
    }
    await channel.delete();
    try {
      const issuer = await client.users.fetch(job.data.issuerId);
      const dm = await issuer.createDM();
      const dmembed = new EmbedBuilder()
        .setColor(0xbd9f26)
        .setTitle(`Your ticket closed.`)
        .setDescription(
          `Your ticket ${channel.name} closed by ${job.data.closedBy}. You can find the transcript by clicking the button below.`,
        )
        .setFooter({
          iconURL:
            'https://cdn.discordapp.com/icons/691045202864898109/516a15b8c83eb141b027621b00afab18.webp?size=100',
          text: 'Powered by Alverrt#4727',
        });
      if (job.data.reason.length > 0) {
        dmembed.addFields([{ name: 'Reason', value: job.data.reason }]);
      }
      const button = new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setLabel('View Transcript')
          .setStyle(ButtonStyle.Link)
          .setURL(thread.url),
      ]);

      await dm.send({ embeds: [dmembed], components: [button] });
    } catch (error) {
      console.log(error, error.stack);
    }
  } catch (error) {
    console.log(error);
  }
  await job.remove();
  cb(null, 'It works');
}
