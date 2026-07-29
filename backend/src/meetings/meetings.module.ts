import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from '../merchants/merchant.entity';
import { User } from '../users/user.entity';
import { Meeting } from './meeting.entity';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  imports:[TypeOrmModule.forFeature([Meeting,Merchant,User])],
  controllers:[MeetingsController],
  providers:[MeetingsService],
})
export class MeetingsModule {}
