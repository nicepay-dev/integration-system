import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { StandbyController } from './standby.controller';
import { StandbySchedule } from './standby.entity';
import { StandbyService } from './standby.service';
import { StandbyHoliday } from './standby-holiday.entity';
@Module({imports:[TypeOrmModule.forFeature([StandbySchedule,StandbyHoliday,User])],controllers:[StandbyController],providers:[StandbyService]})
export class StandbyModule{}
