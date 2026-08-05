import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('standby_schedules')
@Index(['scheduleDate','groupName'],{unique:true})
export class StandbySchedule {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column({type:'date'}) scheduleDate:string;
  @Column({type:'varchar'}) groupName:string;
  @ManyToOne(()=>User,{eager:true,onDelete:'CASCADE'}) member:User;
  @CreateDateColumn() createdAt:Date;
}
