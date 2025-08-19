export class CreateModlogMessageDto {
  guildId: string;
  punisherName: string;
  punishmentType: 'WARNING' | 'BAN' | 'SLAY';
  punishmentDuration: string;
  punishedId: string;
  reason: string;
  url: string;
}
