import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateMerchantDto, UpdateProgressDto } from './merchant.dto';
import { Merchant, MerchantStatus } from './merchant.entity';
import { ProgressUpdate } from './progress-update.entity';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant) private merchants:Repository<Merchant>,
    @InjectRepository(ProgressUpdate) private updates:Repository<ProgressUpdate>,
    @InjectRepository(User) private users:Repository<User>,
  ) {}

  list(search?:string, status?:string) {
    const where:any = {};
    if (search) where.name = ILike(`%${search}%`);
    if (status && Object.values(MerchantStatus).includes(status as MerchantStatus)) where.status = status;
    return this.merchants.find({ where, order:{statusUpdatedAt:'ASC'} });
  }

  async one(id:string) {
    const merchant = await this.merchants.findOne({where:{id},relations:{updates:true},order:{updates:{createdAt:'DESC'}}});
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant;
  }

  async create(dto:CreateMerchantDto) {
    const pic = await this.users.findOneBy({id:dto.picUserId});
    if (!pic) throw new NotFoundException('Selected PIC was not found');
    const {picUserId,...merchant} = dto;
    const paymentMethodStatuses = Object.fromEntries(dto.paymentMethods.map(method=>[method,'Preparing by merchant']));
    return this.merchants.save(this.merchants.create({...merchant,paymentMethodStatuses,picName:pic.name,picEmail:pic.email,code:dto.code.toUpperCase()}));
  }

  async updateProgress(id:string, dto:UpdateProgressDto, by:string) {
    const merchant = await this.one(id);
    merchant.status = dto.status;
    merchant.progress = dto.progress;
    merchant.statusUpdatedAt = new Date();
    merchant.notes = dto.note || merchant.notes;
    if (dto.paymentMethods) merchant.paymentMethods = dto.paymentMethods;
    if (dto.paymentMethodStatuses) {
      const allowed = ['On development','Preparing by merchant','UAT','Ready Live','Live'];
      merchant.paymentMethodStatuses = Object.fromEntries(merchant.paymentMethods.map(method => {
        const requested = dto.paymentMethodStatuses?.[method] || '';
        return [method, allowed.includes(requested) ? requested : (merchant.paymentMethodStatuses?.[method] || 'Preparing by merchant')];
      }));
    }
    await this.merchants.save(merchant);
    await this.updates.save(this.updates.create({merchant,status:dto.status,progress:dto.progress,note:dto.note||null,updatedBy:by}));
    return this.one(id);
  }

  async summary() {
    const all = await this.merchants.find();
    const finished = [MerchantStatus.LIVE, MerchantStatus.CANCEL];
    const stale = all.filter(merchant=>Date.now()-new Date(merchant.statusUpdatedAt).getTime()>=7*86400000 && !finished.includes(merchant.status));
    return {
      total:all.length,
      live:all.filter(merchant=>merchant.status===MerchantStatus.LIVE).length,
      blocked:all.filter(merchant=>merchant.status===MerchantStatus.BLOCKED).length,
      stale:stale.length,
      averageProgress:all.length?Math.round(all.reduce((sum,merchant)=>sum+merchant.progress,0)/all.length):0,
    };
  }
}
