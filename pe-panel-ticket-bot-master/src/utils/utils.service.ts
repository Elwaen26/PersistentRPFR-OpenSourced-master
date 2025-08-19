import { Injectable } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';

@Injectable()
export class UtilsService {
  public buildNewEmbed(title: string, desc: string) {
    return new EmbedBuilder()
      .setColor(0xbd9f26)
      .setTitle(title)
      .setDescription(desc)
      .setFooter({
        iconURL:
          'https://cdn.discordapp.com/icons/691045202864898109/516a15b8c83eb141b027621b00afab18.webp?size=100',
        text: 'Powered by Alverrt#4727',
      });
  }
}
