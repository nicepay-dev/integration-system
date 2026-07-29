import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateMerchantDto, UpdateMerchantDto, UpdateProgressDto } from './merchant.dto';
import { MerchantMidPaymentMethod } from './merchant-mid-payment-method.entity';
import { MerchantMid } from './merchant-mid.entity';
import { Merchant, MerchantStatus } from './merchant.entity';
import { PaymentMethodStatus } from './payment-method-status';
import { ProgressUpdate } from './progress-update.entity';

type NormalizedMid={
  mid:string;
  status:MerchantStatus;
  paymentMethods:string[];
  paymentMethodStatuses:Record<string,PaymentMethodStatus>;
};

@Injectable()
export class MerchantsService {
  private readonly paymentMethodOrder=['CC','VA','CVS','Direct Debit','eWallet','Pay Later','Payout','QRIS'];
  private readonly paymentStatusOrder=Object.values(PaymentMethodStatus);

  constructor(
    @InjectRepository(Merchant) private merchants:Repository<Merchant>,
    @InjectRepository(MerchantMid) private merchantMids:Repository<MerchantMid>,
    @InjectRepository(MerchantMidPaymentMethod) private midPaymentMethods:Repository<MerchantMidPaymentMethod>,
    @InjectRepository(ProgressUpdate) private updates:Repository<ProgressUpdate>,
    @InjectRepository(User) private users:Repository<User>,
  ) {}

  async list(search?:string,status?:string) {
    const query=this.merchants.createQueryBuilder('merchant')
      .leftJoinAndSelect('merchant.mids','mid')
      .leftJoinAndSelect('mid.paymentMethodRecords','paymentMethod')
      .orderBy('merchant.statusUpdatedAt','ASC')
      .addOrderBy('mid.mid','ASC');
    if(search)query.andWhere('(merchant.name ILIKE :search OR merchant.code ILIKE :search)',{search:`%${search}%`});
    if(status&&Object.values(MerchantStatus).includes(status as MerchantStatus))query.andWhere('merchant.status=:status',{status});
    return (await query.getMany()).map(merchant=>this.toResponse(merchant));
  }

  async one(id:string) {
    return this.toResponse(await this.oneEntity(id,true));
  }

  async create(dto:CreateMerchantDto) {
    const pic=await this.users.findOneBy({id:dto.picUserId});
    if(!pic)throw new NotFoundException('Selected PIC was not found');
    const mids=this.normalizeMids(dto.mids,dto.code,dto.paymentMethods,[],MerchantStatus.ONBOARDING);
    const code=this.codeFromMids(mids);
    if(await this.merchants.exists({where:{code}}))throw new ConflictException(`Merchant MID combination "${code}" already exists`);
    await this.ensureMidsAvailable(mids);
    let merchant=await this.merchants.save(this.merchants.create({
      name:dto.name.trim(),code,picName:pic.name,picEmail:pic.email,
      techStacks:dto.techStacks,integrationTypes:dto.integrationTypes,
      targetLiveDate:dto.targetLiveDate?.trim()||null,notes:dto.notes?.trim()||null,
    }));
    await this.syncMids(merchant,mids);
    merchant=await this.oneEntity(merchant.id);
    return this.toResponse(merchant);
  }

  async updateProgress(id:string,dto:UpdateProgressDto,by:string) {
    const merchant=await this.oneEntity(id);
    if(dto.picUserId){
      const pic=await this.users.findOneBy({id:dto.picUserId});
      if(!pic)throw new NotFoundException('Selected PIC was not found');
      merchant.picName=pic.name;
      merchant.picEmail=pic.email;
    }
    merchant.status=dto.status;
    merchant.progress=dto.progress;
    merchant.statusUpdatedAt=new Date();
    merchant.notes=dto.note||merchant.notes;
    for(const mid of merchant.mids||[]){
      const requestedMidStatus=dto.midStatuses?.[mid.mid];
      if(requestedMidStatus&&Object.values(MerchantStatus).includes(requestedMidStatus))mid.status=requestedMidStatus;
      for(const paymentMethod of mid.paymentMethodRecords||[]){
        const requested=dto.midPaymentMethodStatuses?.[mid.mid]?.[paymentMethod.method];
        if(this.validPaymentStatus(requested))paymentMethod.status=requested;
      }
      await this.merchantMids.save(mid);
      if(mid.paymentMethodRecords?.length)await this.midPaymentMethods.save(mid.paymentMethodRecords);
    }
    await this.merchants.save(merchant);
    await this.updates.save(this.updates.create({merchant,status:dto.status,progress:dto.progress,note:dto.note||null,updatedBy:by}));
    return this.one(id);
  }

  async update(id:string,dto:UpdateMerchantDto) {
    let merchant=await this.oneEntity(id);
    if(dto.picUserId){
      const pic=await this.users.findOneBy({id:dto.picUserId});
      if(!pic)throw new NotFoundException('Selected PIC was not found');
      merchant.picName=pic.name;
      merchant.picEmail=pic.email;
    }
    if(dto.mids!==undefined||dto.code!==undefined||dto.paymentMethods!==undefined){
      const mids=this.normalizeMids(dto.mids,dto.code??merchant.code,dto.paymentMethods,this.currentMids(merchant),merchant.status);
      const code=this.codeFromMids(mids);
      const duplicate=await this.merchants.findOneBy({code});
      if(duplicate&&duplicate.id!==id)throw new ConflictException(`Merchant MID combination "${code}" already exists`);
      await this.ensureMidsAvailable(mids,id);
      merchant.code=code;
      await this.merchants.save(merchant);
      await this.syncMids(merchant,mids);
    }
    if(dto.name!==undefined)merchant.name=dto.name.trim();
    if(dto.techStacks!==undefined)merchant.techStacks=dto.techStacks;
    if(dto.integrationTypes!==undefined)merchant.integrationTypes=dto.integrationTypes;
    if(dto.targetLiveDate!==undefined)merchant.targetLiveDate=dto.targetLiveDate.trim()||null;
    if(dto.notes!==undefined)merchant.notes=dto.notes.trim()||null;
    await this.merchants.save(merchant);
    merchant=await this.oneEntity(id);
    return this.toResponse(merchant);
  }

  async remove(id:string) {
    const merchant=await this.merchants.findOneBy({id});
    if(!merchant)throw new NotFoundException('Merchant not found');
    await this.merchants.remove(merchant);
    return {ok:true,message:`${merchant.name} was deleted`};
  }

  async summary() {
    const all=await this.merchants.find();
    const finished=[MerchantStatus.LIVE,MerchantStatus.CANCEL];
    const stale=all.filter(merchant=>Date.now()-new Date(merchant.statusUpdatedAt).getTime()>=7*86400000&&!finished.includes(merchant.status));
    return {
      total:all.length,
      live:all.filter(merchant=>merchant.status===MerchantStatus.LIVE).length,
      blocked:all.filter(merchant=>merchant.status===MerchantStatus.BLOCKED).length,
      stale:stale.length,
      averageProgress:all.length?Math.round(all.reduce((sum,merchant)=>sum+merchant.progress,0)/all.length):0,
    };
  }

  private async oneEntity(id:string,includeUpdates=false) {
    const relations:any={mids:{paymentMethodRecords:true}};
    if(includeUpdates)relations.updates=true;
    const merchant=await this.merchants.findOne({
      where:{id},relations,
      ...(includeUpdates?{order:{updates:{createdAt:'DESC'} as any}}:{}),
    });
    if(!merchant)throw new NotFoundException('Merchant not found');
    return merchant;
  }

  private currentMids(merchant:Merchant):NormalizedMid[] {
    return (merchant.mids||[]).map(item=>({
      mid:item.mid,status:item.status,
      paymentMethods:(item.paymentMethodRecords||[]).map(record=>record.method),
      paymentMethodStatuses:Object.fromEntries((item.paymentMethodRecords||[]).map(record=>[record.method,record.status])),
    }));
  }

  private normalizeMids(
    mids?:{mid:string;status?:MerchantStatus;paymentMethods:string[];paymentMethodStatuses?:Record<string,string>}[],
    legacyCode?:string,
    legacyMethods:string[]=[],
    existingMids:NormalizedMid[]=[],
    defaultStatus=MerchantStatus.ONBOARDING,
  ):NormalizedMid[] {
    const source:Array<{mid:string;status?:MerchantStatus;paymentMethods:string[];paymentMethodStatuses?:Record<string,string>}>=mids?.length
      ?mids
      :(legacyCode||'').split(/[,;\n]+/).filter(Boolean).map(mid=>({mid,paymentMethods:legacyMethods}));
    const combined=new Map<string,NormalizedMid>();
    for(const item of source){
      const mid=String(item.mid||'').trim().toUpperCase();
      if(!mid)continue;
      const previous=existingMids.find(existing=>existing.mid===mid);
      const current=combined.get(mid)||{
        mid,status:item.status||previous?.status||defaultStatus,paymentMethods:[],paymentMethodStatuses:{} as Record<string,PaymentMethodStatus>,
      };
      if(item.status&&Object.values(MerchantStatus).includes(item.status))current.status=item.status;
      for(const method of item.paymentMethods||[]){
        if(!this.paymentMethodOrder.includes(method)||current.paymentMethods.includes(method))continue;
        current.paymentMethods.push(method);
        const requested=item.paymentMethodStatuses?.[method];
        current.paymentMethodStatuses[method]=this.validPaymentStatus(requested)
          ?requested
          :(previous?.paymentMethodStatuses[method]||PaymentMethodStatus.PREPARING);
      }
      combined.set(mid,current);
    }
    if(!combined.size)throw new BadRequestException('Add at least one MID');
    return [...combined.values()].map(item=>({
      ...item,
      paymentMethods:this.paymentMethodOrder.filter(method=>item.paymentMethods.includes(method)),
    }));
  }

  private async syncMids(merchant:Merchant,mids:NormalizedMid[]) {
    await this.merchantMids.createQueryBuilder().delete().where('"merchantId"=:merchantId',{merchantId:merchant.id}).execute();
    for(const item of mids){
      const mid=this.merchantMids.create({
        merchant,mid:item.mid,status:item.status,
        paymentMethodRecords:item.paymentMethods.map(method=>this.midPaymentMethods.create({
          method,status:item.paymentMethodStatuses[method]||PaymentMethodStatus.PREPARING,
        })),
      });
      await this.merchantMids.save(mid);
    }
  }

  private codeFromMids(mids:NormalizedMid[]) {
    return mids.map(item=>item.mid).join(', ');
  }

  private validPaymentStatus(status?:string):status is PaymentMethodStatus {
    return !!status&&this.paymentStatusOrder.includes(status as PaymentMethodStatus);
  }

  private async ensureMidsAvailable(mids:NormalizedMid[],excludeMerchantId?:string) {
    if(!mids.length)return;
    const query=this.merchantMids.createQueryBuilder('mid')
      .leftJoinAndSelect('mid.merchant','merchant')
      .where('mid.mid IN (:...mids)',{mids:mids.map(item=>item.mid)});
    if(excludeMerchantId)query.andWhere('merchant.id<>:excludeMerchantId',{excludeMerchantId});
    const conflict=await query.getOne();
    if(conflict)throw new ConflictException(`MID "${conflict.mid}" is already assigned to ${conflict.merchant.name}`);
  }

  private toResponse(merchant:Merchant) {
    const mids=this.currentMids(merchant);
    const paymentMethods=this.paymentMethodOrder.filter(method=>mids.some(mid=>mid.paymentMethods.includes(method)));
    const paymentMethodStatuses=Object.fromEntries(paymentMethods.map(method=>{
      const statuses=mids.filter(mid=>mid.paymentMethods.includes(method)).map(mid=>mid.paymentMethodStatuses[method]).filter(Boolean);
      const selected=statuses.sort((a,b)=>this.paymentStatusOrder.indexOf(a)-this.paymentStatusOrder.indexOf(b))[0];
      return [method,selected||PaymentMethodStatus.PREPARING];
    }));
    return {...merchant,mids,paymentMethods,paymentMethodStatuses};
  }
}
