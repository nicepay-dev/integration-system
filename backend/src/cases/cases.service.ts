import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Merchant } from '../merchants/merchant.entity';
import { User } from '../users/user.entity';
import { CreateCaseDto, UpdateCaseDto } from './case.dto';
import { CaseRecord, CaseStatus, IssueCategory } from './case.entity';

const paymentAreas:Record<string,string[]>={
  CREDIT_CARD:['REGISTER','CHECK_STATUS','THREE_DS','PAYMENT','REFUND','FDS','CREDENTIAL'],
  VA:['REGISTER','CHECK_STATUS','PAYMENT','CREDENTIAL'],
  CVS:['REGISTER','CHECK_STATUS','PAYMENT','CREDENTIAL'],
  DIRECT_DEBIT:['REGISTER','CHECK_STATUS','PAYMENT','CREDENTIAL'],
  EWALLET:['REGISTER','CHECK_STATUS','PAYMENT','ACCOUNT_BINDING','CREDENTIAL'],
  PAYLOAN:['REGISTER','CHECK_STATUS','PAYMENT','CREDENTIAL'],
  PAYOUT:['REGISTER','APPROVE','DANA_TRANSFER','CHECK_STATUS','BALANCE','CREDENTIAL'],
  QRIS:['REGISTER','CHECK_STATUS','PAYMENT','CREDENTIAL'],
};

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(CaseRecord) private cases:Repository<CaseRecord>,
    @InjectRepository(Merchant) private merchants:Repository<Merchant>,
    @InjectRepository(User) private users:Repository<User>,
  ) {}

  list(status?:string, merchantId?:string, picUserId?:string, search?:string, dateFrom?:string, dateTo?:string, category?:string, paymentMethod?:string, paymentArea?:string) {
    const query=this.cases.createQueryBuilder('case').leftJoinAndSelect('case.merchant','merchant').leftJoinAndSelect('case.pic','pic').orderBy('case.updatedAt','DESC');
    if(status && Object.values(CaseStatus).includes(status as CaseStatus)) query.andWhere('case.status = :status',{status});
    if(merchantId) query.andWhere('merchant.id = :merchantId',{merchantId});
    if(picUserId) query.andWhere('pic.id = :picUserId',{picUserId});
    if(category && Object.values(IssueCategory).includes(category as IssueCategory)) query.andWhere('case.category = :category',{category});
    if(category===IssueCategory.PAYMENT && paymentMethod) {
      if(paymentAreas[paymentMethod]) query.andWhere('case.paymentMethod = :paymentMethod',{paymentMethod});
      else query.andWhere('1 = 0');
    }
    if(category===IssueCategory.PAYMENT && paymentMethod && paymentArea) {
      if(paymentAreas[paymentMethod]?.includes(paymentArea)) query.andWhere('case.paymentArea = :paymentArea',{paymentArea});
      else query.andWhere('1 = 0');
    }
    if(search) query.andWhere('(merchant.name ILIKE :search OR case.issue ILIKE :search OR case.acrTicket ILIKE :search OR case.updateNote ILIKE :search OR case.response ILIKE :search OR case.paymentMethod ILIKE :search OR case.paymentArea ILIKE :search)',{search:`%${search}%`});
    if(dateFrom && !Number.isNaN(Date.parse(dateFrom))) query.andWhere('case.updatedAt >= :dateFrom',{dateFrom:new Date(dateFrom)});
    if(dateTo && !Number.isNaN(Date.parse(dateTo))) query.andWhere('case.updatedAt <= :dateTo',{dateTo:new Date(dateTo)});
    return query.getMany();
  }

  async create(dto:CreateCaseDto, loggedInUserId:string, createdBy:string) {
    const [merchant,pic]=await Promise.all([
      this.merchants.findOneBy({id:dto.merchantId}),
      this.users.findOneBy({id:loggedInUserId}),
    ]);
    if(!merchant) throw new NotFoundException('Merchant not found');
    if(!pic) throw new NotFoundException('Logged-in user was not found');
    let paymentMethod:string|null=null;
    let paymentArea:string|null=null;
    if(dto.category===IssueCategory.PAYMENT){
      paymentMethod=(dto.paymentMethod||'').toUpperCase();
      paymentArea=(dto.paymentArea||'').toUpperCase();
      if(!paymentAreas[paymentMethod]) throw new BadRequestException('Select a valid payment method');
      if(!paymentAreas[paymentMethod].includes(paymentArea)) throw new BadRequestException('Select a valid specific area for the payment method');
    }
    return this.cases.save(this.cases.create({merchant,pic,issue:dto.issue,category:dto.category,paymentMethod,paymentArea,response:dto.response||null,updateNote:dto.action||dto.checkResult||dto.updateNote||null,acrTicket:dto.acrTicket||null,status:dto.status||CaseStatus.CHECKING,createdBy}));
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
    if(dto.action!==undefined) record.updateNote=dto.action||null;
    else if(dto.checkResult!==undefined) record.updateNote=dto.checkResult||null;
    else if(dto.updateNote!==undefined) record.updateNote=dto.updateNote||null;
    if(dto.acrTicket!==undefined) record.acrTicket=dto.acrTicket||null;
    if(dto.status) record.status=dto.status;
    return this.cases.save(record);
  }

  async remove(id:string){
    const record=await this.cases.findOne({where:{id},relations:{merchant:true}});
    if(!record)throw new NotFoundException('Case not found');
    await this.cases.remove(record);
    return{ok:true,message:`Case for ${record.merchant.name} was deleted`};
  }
}
