import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseRecord } from '../cases/case.entity';
import { Meeting } from '../meetings/meeting.entity';
import { Merchant } from '../merchants/merchant.entity';
import { Notification } from './notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({imports:[TypeOrmModule.forFeature([Notification,Merchant,CaseRecord,Meeting])],controllers:[NotificationsController],providers:[NotificationsService]})
export class NotificationsModule {}
