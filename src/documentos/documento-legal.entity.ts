import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

export enum TipoDocumento {
  SOAT = 'SOAT',
  REVISION_TM = 'RevisionTM',
}

@Entity('documento_legal')
export class DocumentoLegal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.documentos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @Column({ type: 'enum', enum: TipoDocumento })
  tipo: TipoDocumento;

  @Column({ name: 'fecha_vencimiento', type: 'date' })
  fechaVencimiento: string;

  @Column({ name: 'archivo_url', type: 'varchar', length: 300, nullable: true })
  archivoUrl: string | null;

  @Column({ type: 'boolean', default: false })
  vencido: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
