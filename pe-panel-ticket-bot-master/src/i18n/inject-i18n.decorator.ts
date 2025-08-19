import { Inject } from '@nestjs/common';

export function InjectI18n(): (
  target: object,
  key: string | symbol,
  index?: number,
) => void {
  return Inject('i18n_TOKEN');
}
