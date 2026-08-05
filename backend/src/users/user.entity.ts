import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('users')
export class User { @PrimaryGeneratedColumn('uuid') id: string; @Column({ unique: true }) email: string; @Column() name: string; @Column({ default: 'staff integrasi' }) role: string; @Column({type:'varchar',nullable:true}) standbyGroup:string|null; @Column() passwordHash: string; @CreateDateColumn() createdAt: Date; }
