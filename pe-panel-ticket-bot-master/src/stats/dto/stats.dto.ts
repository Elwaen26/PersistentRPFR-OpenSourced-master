import { GuildMember } from 'discord.js';
import { MemberOption } from 'necord';

export class StatsOfDto {
  @MemberOption({
    name: 'member',
    description: 'Please select a staff member to see his/her stats.',
    required: true,
  })
  member: GuildMember;
}
