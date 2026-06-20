import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { File } from './file.entity';

@Entity('projects')
export class Project {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_team', default: false })
  isTeam!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => File, (file) => file.project)
  files!: File[];
}
