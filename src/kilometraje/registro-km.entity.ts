import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Usuario } from '../usuarios/usuario.entity';

export enum MomentoKm {
  INICIO = 'inicio',
  FIN    = 'fin',
}

@Entity('registro_km')
export class RegistroKm {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vehiculo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'conductor_id' })
  conductor: Usuario;

  @Column({ name: 'km_valor', type: 'int' })
  kmValor: number;

  @Column({ type: 'enum', enum: MomentoKm })
  momento: MomentoKm;

  @CreateDateColumn({ name: 'registrado_en' })
  registradoEn: Date;
}
