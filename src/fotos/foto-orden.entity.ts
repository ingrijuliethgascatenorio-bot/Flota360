import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrdenTrabajo } from '../ordenes/orden-trabajo.entity';
import { Usuario } from '../usuarios/usuario.entity';

export enum TipoFoto {
  ANTES   = 'antes',
  DESPUES = 'despues',
}

@Entity('foto_orden')
export class FotoOrden {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OrdenTrabajo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orden_id' })
  orden: OrdenTrabajo;

  @Column({ type: 'varchar', length: 300 })
  url: string;

  @Column({ name: 'tipo_foto', type: 'enum', enum: TipoFoto })
  tipoFoto: TipoFoto;

  @Column({ name: 'tamano_bytes', type: 'int', default: 0 })
  tamanoBytes: number;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'subida_por' })
  subidaPor: Usuario | null;

  @CreateDateColumn({ name: 'tomada_en' })
  tomadaEn: Date;
}
