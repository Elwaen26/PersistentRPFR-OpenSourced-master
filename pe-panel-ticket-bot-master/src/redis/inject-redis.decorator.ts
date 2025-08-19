import { ExecutionContext, Inject, createParamDecorator } from '@nestjs/common';

export function InjectRedis(): (
  target: object,
  key: string | symbol,
  index?: number,
) => void {
  return Inject('REDIS_TOKEN');
}
