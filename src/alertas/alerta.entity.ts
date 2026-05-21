import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';
import { DocumentoLegal } from '../documentos/documento-legal.entity';
import { OrdenTrabajo } from '../ordenes/orden-trabajo.entity';

export enum TipoAlerta {
  MANTENIMIENTO_PROXIMO = 'mantenimiento_proximo',
  MANTENIMIENTO_VENCIDO = 'mantenimiento_vencido',
  DOCUMENTO_30DIAS = 'documento_30dias',
  DOCUMENTO_15DIAS = 'documento_15dias',
  DOCUMENTO_7DIAS = 'documento_7dias',
  DOCUMENTO_VENCIDO = 'documento_vencido',
  ORDEN_NUEVA = 'orden_nueva',
}

@Entity('alerta')
@Check(`"plan_id" IS NOT NULL OR "documento_id" IS NOT NULL`)
export class Alerta {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vehiculo)
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @ManyToOne(() => PlanMantenimiento, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: PlanMantenimiento | null;

  @ManyToOne(() => DocumentoLegal, { nullable: true })
  @JoinColumn({ name: 'documento_id' })
  documento: DocumentoLegal | null;

  @Column({ name: 'tipo_alerta', type: 'enum', enum: TipoAlerta })
  tipoAlerta: TipoAlerta;

  @Column({ type: 'varchar', length: 300 })
  mensaje: string;

  @Column({ type: 'boolean', default: false })
  leida: boolean;

  @CreateDateColumn({ name: 'generada_en' })
  generadaEn: Date;
}
