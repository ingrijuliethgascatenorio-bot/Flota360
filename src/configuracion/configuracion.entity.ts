import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('configuracion')
export class Configuracion {
  @PrimaryColumn({ type: 'varchar', length: 60 })
  clave: string;

  @Column({ name: 'valor_entero', type: 'int', nullable: true })
  valorEntero: number | null;

  @Column({ name: 'valor_texto', type: 'varchar', length: 300, nullable: true })
  valorTexto: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  descripcion: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
