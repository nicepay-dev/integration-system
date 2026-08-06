import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from '../merchants/merchant.entity';
import { User } from '../users/user.entity';
import { CaseRecord } from './case.entity';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { CaseHistory } from './case-history.entity';

@Module({imports:[TypeOrmModule.forFeature([CaseRecord,CaseHistory,Merchant,User])],controllers:[CasesController],providers:[CasesService]})
export class CasesModule {}
