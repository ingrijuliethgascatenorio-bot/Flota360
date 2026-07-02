import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehiculo } from '../../vehiculos/vehiculo.entity';
import { Usuario } from '../../usuarios/usuario.entity';
import { OrdenTrabajo } from '../../ordenes/orden-trabajo.entity';
import { EstadoNovedad } from '../enums/estado-novedad.enum';

@Entity('novedad')
export class Novedad {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vehiculo)
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'conductor_id' })
  conductor: Usuario;

  @Column({ name: 'tipo_novedad', type: 'varchar', length: 100 })
  tipoNovedad: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ name: 'fecha_reporte', type: 'timestamp', default: () => 'NOW()' })
  fechaReporte: Date;

  @Column({
    type: 'enum',
    enum: EstadoNovedad,
    default: EstadoNovedad.PENDIENTE,
  })
  estado: EstadoNovedad;

  @Column({ name: 'observacion_admin', type: 'text', nullable: true })
  observacionAdmin: string | null;

  @ManyToOne(() => OrdenTrabajo, { nullable: true })
  @JoinColumn({ name: 'orden_trabajo_id' })
  ordenTrabajo: OrdenTrabajo | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}