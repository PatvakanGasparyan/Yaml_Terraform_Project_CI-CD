import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Project } from './project.entity';
import { File } from './file.entity';

@Entity('users')
export class User {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash?: string;

  @Column()
  name!: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'enum', enum: ['local', 'google', 'github'], default: 'local' })
  provider!: 'local' | 'google' | 'github';

  @Column({ name: 'provider_id', nullable: true })
  providerId?: string;

  @Column({ name: 'github_token', type: 'text', nullable: true, select: false })
  githubToken?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Project, (project) => project.user)
  projects!: Project[];

  @OneToMany(() => File, (file) => file.user)
  files!: File[];
}
