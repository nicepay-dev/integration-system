import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CaseRecord } from '../cases/case.entity';
import { Merchant } from '../merchants/merchant.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id:string;
  @ManyToOne(()=>Merchant,{eager:true,onDelete:'CASCADE',nullable:true}) merchant:Merchant|null;
  @ManyToOne(()=>CaseRecord,{eager:true,onDelete:'CASCADE',nullable:true}) caseRecord:CaseRecord|null;
  @Column() message:string;
  @Column({default:false}) isRead:boolean;
  @Column() staleKey:string;
  @CreateDateColumn() createdAt:Date;
}
