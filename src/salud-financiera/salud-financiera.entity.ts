import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

@Entity('salud_financiera')
@Index(['vehiculo', 'periodo'], { unique: true })
export class SaludFinanciera {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vehiculo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  /** Período en formato YYYY-MM (mes) */
  @Column({ type: 'varchar', length: 7 })
  periodo: string;

  @Column({ name: 'costo_total', type: 'numeric', precision: 12, scale: 2, default: 0 })
  costoTotal: number;

  @Column({ name: 'costo_promedio', type: 'numeric', precision: 12, scale: 2, default: 0 })
  costoPromedio: number;

  @Column({ name: 'num_intervenciones', type: 'int', default: 0 })
  numIntervenciones: number;

  @Column({ name: 'repuesto_mas_usado', type: 'varchar', length: 120, nullable: true })
  repuestoMasUsado: string | null;

  @Column({ name: 'cantidad_repuesto', type: 'int', nullable: true })
  cantidadRepuesto: number | null;

  @CreateDateColumn({ name: 'calculado_en' })
  calculadoEn: Date;
}
