import { Global, Module } from '@nestjs/common';
import { DBConnectionFactory } from './dbconnection.factory';

@Global()
@Module({ providers: [DBConnectionFactory], exports: [DBConnectionFactory] })
export class FactoryModule {}
