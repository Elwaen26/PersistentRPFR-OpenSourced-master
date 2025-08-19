import { Channel, ForumChannel, GuildMember, Role } from 'discord.js';
import { ChannelOption, MemberOption, RoleOption, StringOption } from 'necord';

export class SetupTicketCategoryDto {
  @ChannelOption({
    name: 'category',
    description: 'Please select only category forum.',
    required: true,
  })
  category: Channel;
}

export class SetupTicketPrivateCategoryDto {
  @ChannelOption({
    name: 'category',
    description: 'Please select only category forum.',
    required: true,
  })
  category: Channel;
}

export class SetupTicketTranscriptForumDto {
  @ChannelOption({
    name: 'forum',
    description: 'Please select only one forum.',
    required: true,
  })
  forum: ForumChannel;
}

export class SetupChannelDto {
  @ChannelOption({
    name: 'channel',
    description: 'Please select only one category.',
    required: true,
  })
  channel: Channel;
}

export class SetupPanelTitleDto {
  @StringOption({
    name: 'title',
    description: 'The title of the panel.',
    required: true,
  })
  title: string;
}

export class SetupLanguageDto {
  @StringOption({
    name: 'language',
    description: 'The language of the bot.',
    choices: [
      { name: 'English', value: 'en' },
      { name: 'Turkish', value: 'tr' },
    ],
    required: true,
  })
  language: string;
}

export class SetupPanelDescDto {
  @StringOption({
    name: 'desc',
    description: 'The description of the panel.',
    required: true,
  })
  desc: string;
}

export class SetupPanelCategoryDto {
  @StringOption({
    name: 'categories',
    description: 'The categories of panel dropdown.',
    required: true,
  })
  categories: string;
}

export class SetupPanelStaffDto {
  @RoleOption({
    name: 'staff',
    description: 'The staff role that you want to add to tickets.',
    required: true,
  })
  staff: Role;
}

export class SetupPanelManagerDto {
  @RoleOption({
    name: 'manager',
    description:
      'The manager role that will have access to some private commands.',
    required: true,
  })
  manager: Role;
}

export class SetupPanelModlogChannelDto {
  @ChannelOption({
    name: 'modlog',
    description: 'Please select a channel that will be used as modlog..',
    required: true,
  })
  modlog: Channel;
}

export class SetupWhitelistStorageForumDto {
  @ChannelOption({
    name: 'forum',
    description: 'Please select only one forum.',
    required: true,
  })
  forum: ForumChannel;
}

export class SetupWhitelistPanelChannelDto {
  @ChannelOption({
    name: 'panel',
    description: 'Please select only one channel.',
    required: true,
  })
  channel: Channel;
}

export class SetupWhitelistRemoveUserDto {
  @MemberOption({
    name: 'user',
    description: 'Please select only one user.',
    required: true,
  })
  user: GuildMember;
}
