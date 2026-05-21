import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

export enum TipoCiclo {
  KM         = 'km',
  DIAS       = 'dias',
  COMBINADO  = 'combinado',
}

@Entity('plan_mantenimiento')
export class PlanMantenimiento {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vehiculo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'tipo_ciclo', type: 'enum', enum: TipoCiclo })
  tipoCiclo: TipoCiclo;

  @Column({ name: 'intervalo_km', type: 'int', nullable: true })
  intervaloKm: number | null;

  @Column({ name: 'intervalo_dias', type: 'int', nullable: true })
  intervaloDias: number | null;

  @Column({ name: 'km_proximo', type: 'int', nullable: true })
  kmProximo: number | null;

  @Column({ name: 'fecha_proxima', type: 'date', nullable: true })
  fechaProxima: string | null;

  // RF-INN-01 y RF-INN-02 — predicción
  @Column({ name: 'km_por_dia', type: 'float', nullable: true })
  kmPorDia: number | null;

  @Column({ name: 'fecha_estimada', type: 'date', nullable: true })
  fechaEstimada: string | null;

  @Column({ name: 'color_urgencia', type: 'varchar', length: 10, nullable: true })
  colorUrgencia: string | null;

  @Column({ name: 'prediccion_actualizada_en', type: 'timestamp', nullable: true })
  prediccionActualizadaEn: Date | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
