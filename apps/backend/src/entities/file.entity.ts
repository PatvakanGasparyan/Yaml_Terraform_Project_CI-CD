import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';

@Entity('files')
export class File {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'project_id', nullable: true })
  projectId?: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  path?: string;

  @Column({ default: 'unknown' })
  format!: string;

  @Column({ type: 'longtext' })
  content!: string;

  @Column({ name: 'size_bytes', default: 0 })
  sizeBytes!: number;

  @Column({ name: 'storage_path', nullable: true })
  storagePath?: string;

  @Column({ default: 1 })
  version!: number;

  @Column({ nullable: true })
  checksum?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Project, (project) => project.files, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project;
}
