import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';

@Module({
  providers: [ClaimsService],
})
export class ClaimsModule {}
