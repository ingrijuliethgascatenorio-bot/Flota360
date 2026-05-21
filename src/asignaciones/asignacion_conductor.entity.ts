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
import { Usuario } from '../usuarios/usuario.entity';

export enum TurnoAsignacion {
  MANANA = 'manana',
  TARDE = 'tarde',
  NOCHE = 'noche',
  COMPLETO = 'completo',
}

@Entity('asignacion_conductor')
export class AsignacionConductor {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vehiculo, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'conductor_id' })
  conductor: Usuario;

  @Column({
    type: 'enum',
    enum: TurnoAsignacion,
    default: TurnoAsignacion.COMPLETO,
  })
  turno: TurnoAsignacion;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: string;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin: string | null;

  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
