import {
  IsString, IsNotEmpty, IsInt, Min, Max,
  IsOptional, IsUrl, Length, Matches,
} from 'class-validator';

const anioActual = new Date().getFullYear();

export class CreateVehiculoDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 10)
  @Matches(/^[A-Z0-9]+$/, { message: 'La placa solo puede tener letras mayúsculas y números' })
  placa: string;

  @IsString()
  @IsNotEmpty()
  marca: string;

  @IsString()
  @IsNotEmpty()
  modelo: string;

  @IsInt()
  @Min(1990, { message: 'El año mínimo es 1990' })
  @Max(anioActual, { message: `El año no puede ser mayor a ${anioActual}` })
  anio: number;

  @IsInt()
  @Min(0)
  kmActual: number;

  @IsInt()
  @Min(1)
  capacidad: number;

  @IsString()
  @IsNotEmpty()
  numMotor: string;

  @IsString()
  @IsNotEmpty()
  numChasis: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de vencimiento del SOAT debe ser AAAA-MM-DD' })
  venceSoat: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de vencimiento de la Tecnomecánica debe ser AAAA-MM-DD' })
  venceTecnomecanica: string;

  @IsOptional()
  @IsUrl({}, { message: 'La URL de la foto no es válida' })
  fotoUrl?: string;
}
