import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { OrdenTrabajo } from './orden-trabajo.entity';

@Entity('repuesto_orden')
export class RepuestoOrden {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OrdenTrabajo, (o) => o.repuestos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orden_id' })
  orden: OrdenTrabajo;

  @Column({ name: 'nombre_repuesto', type: 'varchar', length: 120 })
  nombreRepuesto: string;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ name: 'precio_unitario', type: 'numeric', precision: 10, scale: 2 })
  precioUnitario: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  subtotal: number;
}
