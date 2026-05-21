import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

export enum ColorUrgencia {
  VERDE    = 'verde',
  AMARILLO = 'amarillo',
  ROJO     = 'rojo',
  GRIS     = 'gris',   // sin datos suficientes
}

@Entity('prediccion_vehiculo')
@Index(['vehiculo'], { unique: true })
export class PrediccionVehiculo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vehiculo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  /** km/día promedio calculado con los últimos 7 días hábiles */
  @Column({ name: 'km_por_dia', type: 'numeric', precision: 10, scale: 2, nullable: true })
  kmPorDia: number | null;

  /** Días estimados hasta el próximo mantenimiento más urgente */
  @Column({ name: 'dias_estimados', type: 'int', nullable: true })
  diasEstimados: number | null;

  /** Fecha estimada de la próxima intervención */
  @Column({ name: 'fecha_estimada', type: 'date', nullable: true })
  fechaEstimada: string | null;

  /** Nombre del plan más urgente */
  @Column({ name: 'plan_nombre', type: 'varchar', length: 100, nullable: true })
  planNombre: string | null;

  @Column({
    name: 'color_urgencia',
    type: 'enum',
    enum: ColorUrgencia,
    default: ColorUrgencia.GRIS,
  })
  colorUrgencia: ColorUrgencia;

  /** Mensaje explicativo cuando no hay datos suficientes */
  @Column({ name: 'mensaje', type: 'varchar', length: 200, nullable: true })
  mensaje: string | null;

  @UpdateDateColumn({ name: 'calculado_en' })
  calculadoEn: Date;
}
