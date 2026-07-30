import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Merchant } from '../merchants/merchant.entity';
import { User } from '../users/user.entity';

export enum CaseStatus {
  CHECKING = 'CHECKING',
  WAITING_PARTNER = 'WAITING_PARTNER',
  WAITING_MERCHANT = 'WAITING_MERCHANT',
  SOLVED = 'SOLVED',
}

export enum IssueCategory {
  PAYMENT = 'PAYMENT',
  INTEGRATION_API = 'INTEGRATION_API',
  SETTLEMENT_RECONCILIATION = 'SETTLEMENT_RECONCILIATION',
  DASHBOARD_ACCESS = 'DASHBOARD_ACCESS',
  CONFIGURATION = 'CONFIGURATION',
  OTHER = 'OTHER',
}

@Entity('cases')
export class CaseRecord {
  @PrimaryGeneratedColumn('uuid') id:string;
  @ManyToOne(()=>Merchant,{eager:true,onDelete:'CASCADE'}) merchant:Merchant;
  @Column({type:'text'}) issue:string;
  @Column({type:'enum',enum:IssueCategory}) category:IssueCategory;
  @Column({type:'varchar',nullable:true}) paymentMethod:string|null;
  @Column({type:'varchar',nullable:true}) paymentArea:string|null;
  @Column({type:'text',nullable:true}) response:string|null;
  @Column({type:'text',nullable:true}) updateNote:string|null;
  @ManyToOne(()=>User,{eager:true,onDelete:'RESTRICT'}) pic:User;
  @Column({type:'varchar',nullable:true}) acrTicket:string|null;
  @Column({type:'enum',enum:CaseStatus,default:CaseStatus.CHECKING}) status:CaseStatus;
  @Column() createdBy:string;
  @CreateDateColumn() createdAt:Date;
  @UpdateDateColumn() updatedAt:Date;
}
