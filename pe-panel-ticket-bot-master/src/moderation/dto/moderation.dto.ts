import { User } from 'discord.js';
import { StringOption, UserOption } from 'necord';

export class ModerationAddPlayerDto {
  @StringOption({
    name: 'playername',
    description: 'Please type exact player name.',
    required: true,
  })
  playername: string;
}

export class ModerationAddUserDto {
  @UserOption({
    name: 'username',
    description: 'Please type discord user name.',
    required: true,
  })
  user: User;
  @StringOption({
    name: 'playername',
    description: 'Please type valid name which will be users new name.',
    required: true,
  })
  playername: string;
}

export class ModerationRemoveUserDto extends ModerationAddUserDto {}
export class ModerationChangeInGameNameDto extends ModerationAddUserDto {}
