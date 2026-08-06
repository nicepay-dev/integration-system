import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LibraryProject } from './project-library.entity';

@Entity('project_library_history')
export class ProjectLibraryHistory {
  @PrimaryGeneratedColumn('uuid') id:string;
  @ManyToOne(()=>LibraryProject,{onDelete:'CASCADE'}) project:LibraryProject;
  @Column() action:string;
  @Column() changedBy:string;
  @Column({type:'jsonb',default:()=>"'{}'::jsonb"}) changes:Record<string,{from:unknown;to:unknown}>;
  @CreateDateColumn() createdAt:Date;
}
