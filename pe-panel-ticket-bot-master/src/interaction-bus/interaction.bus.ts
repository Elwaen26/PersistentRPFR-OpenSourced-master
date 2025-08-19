import { Injectable } from '@nestjs/common';
import { Interaction, MessageComponentInteraction } from 'discord.js';

interface InteactionItem {
  createdAt: Date;
  interaction: MessageComponentInteraction;
}

@Injectable()
export class InteractionBus {
  private interactions = new Map<string, InteactionItem>();
  constructor() {}

  public set(interaction: MessageComponentInteraction) {
    this.interactions.set(interaction.id, {
      createdAt: new Date(),
      interaction: interaction,
    });
    return;
  }

  public get(interactionId: string) {
    const foundInteraction = this.interactions.get(interactionId);
    this.interactions.delete(interactionId);
    return foundInteraction;
  }
}
