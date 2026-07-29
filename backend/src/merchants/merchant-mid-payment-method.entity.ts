import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { MerchantMid } from './merchant-mid.entity';
import { PaymentMethodStatus } from './payment-method-status';

@Entity('merchant_mid_payment_methods')
@Unique('UQ_merchant_mid_payment_method',['merchantMid','method'])
export class MerchantMidPaymentMethod {
  @PrimaryGeneratedColumn('uuid') id:string;
  @ManyToOne(()=>MerchantMid,merchantMid=>merchantMid.paymentMethodRecords,{onDelete:'CASCADE'}) merchantMid:MerchantMid;
  @Column() method:string;
  @Column({type:'enum',enum:PaymentMethodStatus,enumName:'merchant_mid_payment_methods_status_enum',default:PaymentMethodStatus.PREPARING}) status:PaymentMethodStatus;
}
