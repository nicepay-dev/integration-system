import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Merchant } from './merchant.entity';
import { MerchantStatus } from './merchant-status';
@Entity('progress_updates')
export class ProgressUpdate { @PrimaryGeneratedColumn('uuid') id: string; @ManyToOne(() => Merchant, m => m.updates, { onDelete: 'CASCADE' }) merchant: Merchant; @Column({ type: 'enum', enum: MerchantStatus }) status: MerchantStatus; @Column({ type: 'int' }) progress: number; @Column({ type: 'text', nullable: true }) note: string | null; @Column() updatedBy: string; @CreateDateColumn() createdAt: Date; }
