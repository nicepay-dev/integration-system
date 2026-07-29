import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Merchant } from '../merchants/merchant.entity';
import { User } from '../users/user.entity';

export enum MeetingType {
  KICKOFF='KICKOFF',
  TECHNICAL_DISCUSSION='TECHNICAL_DISCUSSION',
  UAT='UAT',
  GO_LIVE='GO_LIVE',
  FOLLOW_UP='FOLLOW_UP',
  OTHER='OTHER',
}

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid') id:string;
  @ManyToOne(()=>Merchant,{eager:true,nullable:true,onDelete:'SET NULL'}) merchant:Merchant|null;
  @Column({type:'varchar',nullable:true}) merchantName:string|null;
  @Column({type:'timestamptz'}) meetingDate:Date;
  @ManyToOne(()=>User,{eager:true,onDelete:'RESTRICT'}) pic:User;
  @Column({type:'enum',enum:MeetingType,default:MeetingType.TECHNICAL_DISCUSSION}) meetingType:MeetingType;
  @Column({type:'varchar',nullable:true}) attendees:string|null;
  @Column({type:'varchar',nullable:true}) location:string|null;
  @Column({type:'text',nullable:true}) agenda:string|null;
  @Column({type:'text'}) mom:string;
  @Column({type:'text',nullable:true}) actionItems:string|null;
  @Column({type:'date',nullable:true}) nextFollowUpDate:string|null;
  @Column() createdBy:string;
  @CreateDateColumn() createdAt:Date;
  @UpdateDateColumn() updatedAt:Date;
}
