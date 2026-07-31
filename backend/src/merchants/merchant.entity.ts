import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MerchantMid } from './merchant-mid.entity';
import { ProgressUpdate } from './progress-update.entity';
import { MerchantStatus } from './merchant-status';
export { MerchantStatus } from './merchant-status';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column() name:string;
  @Column({unique:true}) code:string;
  @Column({type:'varchar',nullable:true}) company:string|null;
  @Column({type:'varchar',nullable:true}) website:string|null;
  @Column({type:'varchar',nullable:true}) salesPic:string|null;
  @Column({type:'varchar',nullable:true}) picName:string|null;
  @Column({type:'varchar',nullable:true}) picEmail:string|null;
  @OneToMany(()=>MerchantMid,mid=>mid.merchant,{cascade:true}) mids:MerchantMid[];
  @Column({type:'jsonb',default:()=>"'[]'"}) techStacks:string[];
  @Column({type:'jsonb',default:()=>"'[]'"}) integrationTypes:string[];
  @Column({type:'enum',enum:MerchantStatus,default:MerchantStatus.ONBOARDING}) status:MerchantStatus;
  @Column({type:'int',default:10}) progress:number;
  @Column({type:'date',nullable:true}) targetLiveDate:string|null;
  @Column({type:'text',nullable:true}) notes:string|null;
  @Column({type:'timestamptz',default:()=> 'CURRENT_TIMESTAMP'}) statusUpdatedAt:Date;
  @OneToMany(()=>ProgressUpdate,update=>update.merchant) updates:ProgressUpdate[];
  @CreateDateColumn() createdAt:Date;
  @UpdateDateColumn() updatedAt:Date;
}
