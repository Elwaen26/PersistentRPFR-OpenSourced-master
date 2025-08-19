import { Global, Logger, Module } from '@nestjs/common';
import * as i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import I18NexFsBackend, { FsBackendOptions } from 'i18next-fs-backend';
import { join } from 'path';

@Global()
@Module({
  providers: [
    {
      provide: 'i18n_TOKEN',
      useFactory: () => {
        try {
          i18next.use(Backend).init<FsBackendOptions>({
            debug: process.env.NODE_ENV === 'development',
            fallbackLng: 'en',
            defaultNS: 'whitelist',
            preload: ['en', 'tr'],
            lng: 'en',
            ns: [
              'whitelist',
              'setup',
              'tickets',
              'moderation',
              'events',
              'claims',
              'transcripts',
            ],
            backend: { loadPath: join(__dirname, '/{{lng}}/{{ns}}.json') },
          });
          return i18next;
        } catch (error) {
          console.log(error);
        }
      },
    },
  ],
  exports: ['i18n_TOKEN'],
})
export class I18nModule {}
