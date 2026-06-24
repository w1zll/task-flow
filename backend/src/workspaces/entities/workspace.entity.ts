import { Board } from '@/boards/entities/board.entity';
import { User } from '@/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkspaceMember } from './workspace-member.entity';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ default: false })
  isPersonal: boolean;

  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.ownedWorkspaces, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => WorkspaceMember, (member) => member.workspace, {
    cascade: true,
  })
  members: WorkspaceMember[];

  @OneToMany(() => Board, (board) => board.workspace)
  boards: Board[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
