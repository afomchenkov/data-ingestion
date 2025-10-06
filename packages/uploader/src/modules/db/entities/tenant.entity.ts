import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'tenant' })
export class TenantEntity extends BaseEntity {
  @Column({ name: 'name' })
  public name: string;

  @Column({ name: 'phone' })
  public phone: string;

  @Column({ name: 'email' })
  public email: string;
}
