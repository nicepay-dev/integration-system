import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Not, Repository } from 'typeorm';
import { CaseRecord, CaseStatus } from '../cases/case.entity';
import { Merchant, MerchantStatus } from '../merchants/merchant.entity';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    @InjectRepository(Notification) private notifications:Repository<Notification>,
    @InjectRepository(Merchant) private merchants:Repository<Merchant>,
    @InjectRepository(CaseRecord) private cases:Repository<CaseRecord>,
  ) {}

  async onModuleInit(){
    await this.clearFinishedNotifications();
    await this.flagStaleMerchants();
    await this.flagStaleCases();
  }

  async list(){
    await this.clearFinishedNotifications();
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
      if(!await this.notifications.exists({where:{staleKey}})) await this.notifications.save(this.notifications.create({merchant:null,caseRecord,staleKey,message:`Case for ${caseRecord.merchant.name} has not been updated or solved for 2+ days.`}));
    }
  }
}
