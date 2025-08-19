import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.connectdb();
  }

  async connectdb() {
    try {
      await this.$connect();
    } catch (error) {
      console.log(error, error.stack);
      setTimeout(() => {
        this.connectdb();
      }, 2000);
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
