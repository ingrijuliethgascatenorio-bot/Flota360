// vehiculo.entity.ts — fragmento del Sprint 3
// (Añadir export a la entidad existente del Sprint 1)
//
// En tu vehiculo.entity.ts del Sprint 1 asegúrate de tener:
//
//   export enum EstadoSemaforo {
//     VERDE    = 'verde',
//     AMARILLO = 'amarillo',
//     ROJO     = 'rojo',
//   }
//
// Y en la clase Vehiculo:
//
//   @Column({
//     name: 'estado_semaforo',
//     type: 'enum',
//     enum: EstadoSemaforo,
//     default: EstadoSemaforo.VERDE,
//   })
//   estadoSemaforo: EstadoSemaforo;
//
// Referencia completa (compatible con el schema flotacontrol_schema.sql):

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DocumentoLegal } from '../documentos/documento-legal.entity';

export enum EstadoSemaforo {
  VERDE = 'verde',
  AMARILLO = 'amarillo',
  ROJO = 'rojo',
}

/**
 * NOTA: Este archivo es la referencia mínima del Sprint 3.
 * Si ya tienes vehiculo.entity.ts del Sprint 1, solo agrega/verifica:
 *  - export enum EstadoSemaforo
 *  - campo estadoSemaforo con @Column enum
 */
@Entity('vehiculo')
export class Vehiculo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  placa: string;

  @Column({ type: 'varchar', length: 60 })
  marca: string;

  @Column({ type: 'varchar', length: 60 })
  modelo: string;

  @Column({ type: 'smallint' })
  anio: number;

  @Column({ name: 'km_actual', type: 'int', default: 0 })
  kmActual: number;

  @Column({ type: 'smallint' })
  capacidad: number;

  @Column({ name: 'num_motor', type: 'varchar', length: 50, unique: true })
  numMotor: string;

  @Column({ name: 'num_chasis', type: 'varchar', length: 50, unique: true })
  numChasis: string;

  @Column({ name: 'foto_url', type: 'varchar', length: 300, nullable: true })
  fotoUrl: string | null;

  @Column({
    name: 'estado_semaforo',
    type: 'enum',
    enum: EstadoSemaforo,
    default: EstadoSemaforo.VERDE,
  })
  estadoSemaforo: EstadoSemaforo;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => DocumentoLegal, (doc) => doc.vehiculo)
  documentos: DocumentoLegal[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
