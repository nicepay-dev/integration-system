import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum StandbyHolidayType { PUBLIC_HOLIDAY='PUBLIC_HOLIDAY', JOINT_HOLIDAY='JOINT_HOLIDAY' }
@Entity('standby_holidays') @Index(['holidayDate'],{unique:true})
export class StandbyHoliday {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column({type:'date'}) holidayDate:string;
  @Column({type:'varchar'}) name:string;
  @Column({type:'enum',enum:StandbyHolidayType}) holidayType:StandbyHolidayType;
}
