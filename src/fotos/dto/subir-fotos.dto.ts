import { IsEnum } from 'class-validator';
import { TipoFoto } from '../foto-orden.entity';

export class SubirFotosDto {
  @IsEnum(TipoFoto, { message: "tipoFoto debe ser 'antes' o 'despues'" })
  tipoFoto: TipoFoto;
}
