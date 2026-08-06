import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
export enum ProjectCategory { INTERNAL_TOOL='INTERNAL_TOOL', INTEGRATION='INTEGRATION', AUTOMATION='AUTOMATION', DOCUMENTATION='DOCUMENTATION', RESEARCH='RESEARCH', OTHER='OTHER' }
export enum ProjectStatus { IDEA='IDEA', PLANNING='PLANNING', IN_PROGRESS='IN_PROGRESS', MAINTENANCE='MAINTENANCE', COMPLETED='COMPLETED', ARCHIVED='ARCHIVED' }
@Entity('project_library')
export class LibraryProject {
 @PrimaryGeneratedColumn('uuid') id:string; @Column() name:string;
 @Column({type:'enum',enum:ProjectCategory}) category:ProjectCategory; @Column({type:'text'}) description:string;
 @Column({type:'varchar',nullable:true}) projectUrl:string|null; @ManyToOne(()=>User,{eager:true,onDelete:'SET NULL',nullable:true}) pic:User|null;
 @Column({type:'varchar',nullable:true}) technology:string|null; @Column({type:'enum',enum:ProjectStatus,default:ProjectStatus.IDEA}) status:ProjectStatus;
 @Column({type:'text',nullable:true}) notes:string|null; @Column() createdBy:string; @CreateDateColumn() createdAt:Date; @UpdateDateColumn() updatedAt:Date;
}
