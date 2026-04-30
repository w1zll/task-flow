import { Column } from '@/columns/entities/column.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column as OrmColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OrmColumn({ length: 500 })
  title: string;

  @OrmColumn({ type: 'text', nullable: true })
  description: string;

  @OrmColumn({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @OrmColumn({ default: 0 })
  order: number;

  @OrmColumn({ type: 'simple-array', nullable: true })
  labels: string[]; // e.g. ['bug', 'feature', 'design']

  @OrmColumn({ nullable: true })
  dueDate: Date;

  @OrmColumn({ nullable: true, length: 200 })
  assigneeName: string; // simple string for pet project

  @OrmColumn()
  columnId: string;

  @ManyToOne(() => Column, (col) => col.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'columnId' })
  column: Column;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
