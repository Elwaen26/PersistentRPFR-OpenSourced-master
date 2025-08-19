import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { i18n } from 'i18next';
import { Redis } from 'ioredis';
import { InjectI18n } from 'src/i18n/inject-i18n.decorator';
import { InjectRedis } from 'src/redis/inject-redis.decorator';
import { RedisKeys } from 'src/redis/redis.keys';

@Injectable()
export class TranscriptsService {
  private readonly logger = new Logger(TranscriptsService.name);
  constructor(
    @InjectQueue(process.env.TRANSCRIPTS_QUEUE) private transcriptsQueue: Queue,
    @InjectI18n() private readonly i18n: i18n,
    @InjectRedis() private readonly redisClient: Redis,
  ) {}

  async addNewTranscriptJob(
    forumid: string,
    channelid: string,
    ticketNumber: string,
    closedBy: string,
    issuerName: string,
    issuerId: string,
    i18n: i18n,
    guildId: string,
    _reason?: string,
  ) {
    const configuredLang =
      (await this.redisClient.get(`${guildId}:${RedisKeys.BotLanguage}`)) ||
      'en';
    const reason = _reason ? _reason : '';
    await this.transcriptsQueue.add({
      forumid: forumid,
      channelid: channelid,
      ticketNumber: ticketNumber,
      closedBy: closedBy,
      issuerName: issuerName,
      issuerId: issuerId,
      reason: reason,
      i18n: i18n,
      lang: configuredLang,
    });
    // this.transcriptsQueue.on('completed', async (job) => {
    //   await job.remove();
    // });
    // this.transcriptsQueue.on('failed', async (job) => {
    //   await job.remove();
    // });
  }
}
