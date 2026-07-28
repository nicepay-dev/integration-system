import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Merchant } from '../merchants/merchant.entity';
import { User } from '../users/user.entity';
import { CreateCaseDto, UpdateCaseDto } from './case.dto';
import { CaseRecord, CaseStatus } from './case.entity';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(CaseRecord) private cases:Repository<CaseRecord>,
    @InjectRepository(Merchant) private merchants:Repository<Merchant>,
    @InjectRepository(User) private users:Repository<User>,
  ) {}

  list(status?:string, merchantId?:string, search?:string, dateFrom?:string, dateTo?:string) {
    const query=this.cases.createQueryBuilder('case').leftJoinAndSelect('case.merchant','merchant').leftJoinAndSelect('case.pic','pic').orderBy('case.updatedAt','DESC');
    if(status && Object.values(CaseStatus).includes(status as CaseStatus)) query.andWhere('case.status = :status',{status});
    if(merchantId) query.andWhere('merchant.id = :merchantId',{merchantId});
    if(search) query.andWhere('(merchant.name ILIKE :search OR case.issue ILIKE :search OR case.acrTicket ILIKE :search)',{search:`%${search}%`});
    if(dateFrom && !Number.isNaN(Date.parse(dateFrom))) query.andWhere('case.updatedAt >= :dateFrom',{dateFrom:new Date(`${dateFrom}T00:00:00+07:00`)});
    if(dateTo && !Number.isNaN(Date.parse(dateTo))) {
      const end=new Date(`${dateTo}T00:00:00+07:00`);
      end.setDate(end.getDate()+1);
      query.andWhere('case.updatedAt < :dateTo',{dateTo:end});
    }
    return query.getMany();
  }

  async create(dto:CreateCaseDto, createdBy:string) {
    const merchant=await this.merchants.findOneBy({id:dto.merchantId});
    if(!merchant) throw new NotFoundException('Merchant not found');
    const pic=await this.users.findOneBy({id:dto.picUserId});
    if(!pic) throw new NotFoundException('PIC not found');
    return this.cases.save(this.cases.create({merchant,pic,issue:dto.issue,category:dto.category,response:dto.response||null,updateNote:dto.updateNote||null,acrTicket:dto.acrTicket||null,status:dto.status||CaseStatus.CHECKING,createdBy}));
  }

  async update(id:string,dto:UpdateCaseDto) {
    const record=await this.cases.findOneBy({id});
    if(!record) throw new NotFoundException('Case not found');
    if(dto.picUserId) {
      const pic=await this.users.findOneBy({id:dto.picUserId});
      if(!pic) throw new NotFoundException('PIC not found');
      record.pic=pic;
    }
    if(dto.response!==undefined) record.response=dto.response||null;
    if(dto.updateNote!==undefined) record.updateNote=dto.updateNote||null;
    if(dto.acrTicket!==undefined) record.acrTicket=dto.acrTicket||null;
    if(dto.status) record.status=dto.status;
    return this.cases.save(record);
  }
}
