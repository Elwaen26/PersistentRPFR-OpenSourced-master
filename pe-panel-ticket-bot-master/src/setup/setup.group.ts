import { createCommandGroupDecorator } from 'necord';

export const UtilsCommandDecorator = createCommandGroupDecorator({
  name: 'setup',
  description: 'Setup related things.',
});

export const WhiteListCommandGroup = createCommandGroupDecorator({
  name: 'whitelist',
  description: 'Whitelist related things.',
});
