import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Merchant } from './merchant.entity';
import { MerchantStatus } from './merchant-status';
import { MerchantMidPaymentMethod } from './merchant-mid-payment-method.entity';

@Entity('merchant_mids')
@Unique('UQ_merchant_mid_per_merchant',['merchant','mid'])
export class MerchantMid {
  @PrimaryGeneratedColumn('uuid') id:string;
  @ManyToOne(()=>Merchant,merchant=>merchant.mids,{onDelete:'CASCADE'}) merchant:Merchant;
  @Column() mid:string;
  @Column({type:'enum',enum:MerchantStatus,enumName:'merchant_mids_status_enum',default:MerchantStatus.ONBOARDING}) status:MerchantStatus;
  @OneToMany(()=>MerchantMidPaymentMethod,paymentMethod=>paymentMethod.merchantMid,{cascade:true}) paymentMethodRecords:MerchantMidPaymentMethod[];
}
