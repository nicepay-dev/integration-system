import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../merchants/merchant.entity';
import { User } from '../users/user.entity';
import { CreateMeetingDto, UpdateMeetingDto } from './meeting.dto';
import { Meeting } from './meeting.entity';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting) private meetings:Repository<Meeting>,
    @InjectRepository(Merchant) private merchants:Repository<Merchant>,
    @InjectRepository(User) private users:Repository<User>,
  ) {}

  list(search?:string,merchantId?:string,picUserId?:string,dateFrom?:string,dateTo?:string) {
    const query=this.meetings.createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.merchant','merchant')
      .leftJoinAndSelect('meeting.pic','pic')
      .orderBy('meeting.meetingDate','DESC');
    if(search)query.andWhere('(merchant.name ILIKE :search OR meeting.merchantName ILIKE :search OR meeting.mom ILIKE :search OR meeting.agenda ILIKE :search OR meeting.actionItems ILIKE :search)',{search:`%${search}%`});
    if(merchantId==='EXTERNAL')query.andWhere('merchant.id IS NULL');
    else if(merchantId)query.andWhere('merchant.id=:merchantId',{merchantId});
    if(picUserId)query.andWhere('pic.id=:picUserId',{picUserId});
    if(dateFrom&&!Number.isNaN(Date.parse(dateFrom)))query.andWhere('meeting.meetingDate>=:dateFrom',{dateFrom:new Date(`${dateFrom}T00:00:00+07:00`)});
    if(dateTo&&!Number.isNaN(Date.parse(dateTo))){
      const end=new Date(`${dateTo}T00:00:00+07:00`);
      end.setDate(end.getDate()+1);
      query.andWhere('meeting.meetingDate<:dateTo',{dateTo:end});
    }
    return query.getMany();
  }

  async create(dto:CreateMeetingDto,createdBy:string) {
    const [merchant,pic]=await Promise.all([
      dto.merchantId?this.merchants.findOneBy({id:dto.merchantId}):Promise.resolve(null),
      this.users.findOneBy({id:dto.picUserId}),
    ]);
    if(dto.merchantId&&!merchant)throw new NotFoundException('Merchant not found');
    const merchantName=dto.merchantName?.trim()||merchant?.name||'';
    if(!merchantName)throw new BadRequestException('Select a merchant or enter another merchant name');
    if(!pic)throw new NotFoundException('PIC not found');
    return this.meetings.save(this.meetings.create({
      merchant,merchantName,pic,meetingDate:new Date(dto.meetingDate),meetingType:dto.meetingType,
      attendees:dto.attendees?.trim()||null,location:dto.location?.trim()||null,
      agenda:dto.agenda?.trim()||null,mom:dto.mom?.trim()||'',
      actionItems:dto.actionItems?.trim()||null,nextFollowUpDate:dto.nextFollowUpDate?.trim()||null,createdBy,
    }));
  }

  async update(id:string,dto:UpdateMeetingDto) {
    const meeting=await this.meetings.findOneBy({id});
    if(!meeting)throw new NotFoundException('Meeting not found');
    if(dto.merchantId!==undefined){
      if(dto.merchantId){
        const merchant=await this.merchants.findOneBy({id:dto.merchantId});
        if(!merchant)throw new NotFoundException('Merchant not found');
        meeting.merchant=merchant;
        meeting.merchantName=merchant.name;
      }else{
        meeting.merchant=null;
      }
    }
    if(dto.merchantName!==undefined)meeting.merchantName=dto.merchantName.trim()||null;
    if(dto.picUserId){
      const pic=await this.users.findOneBy({id:dto.picUserId});
      if(!pic)throw new NotFoundException('PIC not found');
      meeting.pic=pic;
    }
    if(dto.meetingDate!==undefined)meeting.meetingDate=new Date(dto.meetingDate);
    if(dto.meetingType!==undefined)meeting.meetingType=dto.meetingType;
    if(dto.attendees!==undefined)meeting.attendees=dto.attendees.trim()||null;
    if(dto.location!==undefined)meeting.location=dto.location.trim()||null;
    if(dto.agenda!==undefined)meeting.agenda=dto.agenda.trim()||null;
    if(dto.mom!==undefined)meeting.mom=dto.mom.trim();
    if(dto.actionItems!==undefined)meeting.actionItems=dto.actionItems.trim()||null;
    if(dto.nextFollowUpDate!==undefined)meeting.nextFollowUpDate=dto.nextFollowUpDate.trim()||null;
    if(!meeting.merchant&&!meeting.merchantName)throw new BadRequestException('Select a merchant or enter another merchant name');
    return this.meetings.save(meeting);
  }

  async remove(id:string) {
    const meeting=await this.meetings.findOne({where:{id},relations:{merchant:true}});
    if(!meeting)throw new NotFoundException('Meeting not found');
    await this.meetings.remove(meeting);
    return {ok:true,message:`Meeting for ${meeting.merchant?.name||meeting.merchantName} was deleted`};
  }
}
