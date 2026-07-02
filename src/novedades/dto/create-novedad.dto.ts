import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNovedadDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  tipoNovedad: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  descripcion: string;
}