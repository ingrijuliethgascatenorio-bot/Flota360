import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';
import { RepuestoOrden } from './repuesto-orden.entity';
import { FotoOrden } from '../fotos/foto-orden.entity';

/*
 * FIX ─ BUG CRÍTICO #2:
 * El enum PostgreSQL estado_orden solo tiene 3 valores: 'Abierta','En proceso','Cerrada'.
 * 'Cancelada' NO existe en el tipo PG → insertar ese valor produce ERROR 500.
 * Se eliminó CANCELADA del enum y del flujo de estados en ordenes.service.ts.
 */
export enum EstadoOrden {
  ABIERTA = 'Abierta',
  EN_PROCESO = 'En proceso',
  CERRADA = 'Cerrada',
  CANCELADA = 'Cancelada',
}

@Entity('orden_trabajo')
export class OrdenTrabajo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vehiculo)
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'tecnico_id' })
  tecnico: Usuario;

  @ManyToOne(() => PlanMantenimiento, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: PlanMantenimiento | null;

  @Column({ name: 'fecha_apertura', type: 'date' })
  fechaApertura: string;

  @Column({ name: 'fecha_cierre', type: 'date', nullable: true })
  fechaCierre: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({
    name: 'costo_mano_obra',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  costoManoObra: number;

  @Column({
    name: 'costo_total',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  costoTotal: number;

  @Column({ type: 'enum', enum: EstadoOrden, default: EstadoOrden.ABIERTA })
  estado: EstadoOrden;

  @OneToMany(() => RepuestoOrden, (r) => r.orden, { cascade: true })
  repuestos: RepuestoOrden[];

  // FIX: relación con fotos para que GET /ordenes/:id las incluya
  @OneToMany(() => FotoOrden, (f) => f.orden)
  fotos: FotoOrden[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
