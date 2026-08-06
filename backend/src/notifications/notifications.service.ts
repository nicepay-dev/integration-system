import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThanOrEqual, Like, Not, Repository } from 'typeorm';
import { CaseRecord, CaseStatus } from '../cases/case.entity';
import { Meeting } from '../meetings/meeting.entity';
import { Merchant, MerchantStatus } from '../merchants/merchant.entity';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    @InjectRepository(Notification) private notifications:Repository<Notification>,
    @InjectRepository(Merchant) private merchants:Repository<Merchant>,
    @InjectRepository(CaseRecord) private cases:Repository<CaseRecord>,
    @InjectRepository(Meeting) private meetings:Repository<Meeting>,
  ) {}

  async onModuleInit(){
    await this.clearFinishedNotifications();
    await this.clearInvalidMeetingNotifications();
    await this.flagStaleMerchants();
    await this.flagStaleCases();
    await this.flagUpcomingMeetings();
  }

  async list(){
    await this.clearFinishedNotifications();
    await this.clearInvalidMeetingNotifications();
    await this.flagUpcomingMeetings();
    return this.notifications.find({order:{createdAt:'DESC'},take:100});
  }
  async read(id:string){await this.notifications.update(id,{isRead:true});return{ok:true};}
  async readAll(){await this.notifications.update({isRead:false},{isRead:true});return{ok:true};}

  private async clearFinishedNotifications(){
    const existing=await this.notifications.find();
    const finished=existing.filter(notification=>
      notification.merchant?.status===MerchantStatus.LIVE ||
      notification.merchant?.status===MerchantStatus.CANCEL ||
      notification.caseRecord?.status===CaseStatus.SOLVED
    );
    if(finished.length) await this.notifications.remove(finished);
  }

  @Cron('0 0 9 * * *',{timeZone:'Asia/Jakarta'})
  async flagStaleMerchants(){
    const cutoff=new Date(Date.now()-7*86400000);
    const merchants=await this.merchants.find({where:{statusUpdatedAt:LessThanOrEqual(cutoff),status:Not(In([MerchantStatus.LIVE,MerchantStatus.CANCEL]))}});
    for(const merchant of merchants){
      const staleKey=`merchant:${merchant.id}:${new Date(merchant.statusUpdatedAt).toISOString()}`;
      if(!await this.notifications.exists({where:{staleKey}})) await this.notifications.save(this.notifications.create({merchant,caseRecord:null,staleKey,message:`${merchant.name} has not been updated for 7+ days.`}));
    }
  }

  @Cron('0 15 9 * * *',{timeZone:'Asia/Jakarta'})
  async flagStaleCases(){
    const cutoff=new Date(Date.now()-2*86400000);
    const cases=await this.cases.find({where:{updatedAt:LessThanOrEqual(cutoff),status:Not(CaseStatus.SOLVED)}});
    for(const caseRecord of cases){
      const staleKey=`case:${caseRecord.id}:${new Date(caseRecord.updatedAt).toISOString()}`;
      if(!await this.notifications.exists({where:{staleKey}})) await this.notifications.save(this.notifications.create({merchant:null,caseRecord,staleKey,message:`Case for ${caseRecord.merchant?.name||'Internal — Merchant notice'} has not been updated or solved for 2+ days.`}));
    }
  }

  @Cron('0 * * * * *',{timeZone:'Asia/Jakarta'})
  async flagUpcomingMeetings(){
    const now=new Date();
    const reminderWindowEnd=new Date(now.getTime()+60*60*1000);
    const meetings=await this.meetings.find({
      where:{meetingDate:Between(now,reminderWindowEnd)},
      relations:{merchant:true,pic:true},
      order:{meetingDate:'ASC'},
    });
    for(const meeting of meetings){
      const staleKey=this.meetingReminderKey(meeting);
      if(await this.notifications.exists({where:{staleKey}}))continue;
      const meetingName=meeting.merchant?.name||meeting.merchantName||'External organization';
      const plannedAt=new Intl.DateTimeFormat('en-GB',{
        timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short',
      }).format(new Date(meeting.meetingDate));
      await this.notifications.save(this.notifications.create({
        merchant:null,
        caseRecord:null,
        staleKey,
        message:`Meeting with ${meetingName} starts within one hour (${plannedAt} WIB). PIC: ${meeting.pic.name}.`,
      }));
    }
  }

  private async clearInvalidMeetingNotifications(){
    const reminders=await this.notifications.find({where:{staleKey:Like('meeting:%')}});
    if(!reminders.length)return;
    const meetingIds=reminders
      .map(notification=>this.parseMeetingReminder(notification.staleKey)?.meetingId)
      .filter((id):id is string=>!!id);
    const meetings=meetingIds.length?await this.meetings.findBy({id:In(meetingIds)}):[];
    const meetingsById=new Map(meetings.map(meeting=>[meeting.id,meeting]));
    const invalid=reminders.filter(notification=>{
      const parsed=this.parseMeetingReminder(notification.staleKey);
      const meeting=parsed&&meetingsById.get(parsed.meetingId);
      return !parsed||!meeting||this.meetingReminderKey(meeting)!==notification.staleKey;
    });
    if(invalid.length)await this.notifications.remove(invalid);
  }

  private meetingReminderKey(meeting:Meeting){
    return `meeting:${meeting.id}:${new Date(meeting.meetingDate).toISOString()}`;
  }

  private parseMeetingReminder(staleKey:string){
    const match=/^meeting:([0-9a-f-]+):(.+)$/.exec(staleKey);
    return match?{meetingId:match[1],plannedAt:match[2]}:null;
  }
}
