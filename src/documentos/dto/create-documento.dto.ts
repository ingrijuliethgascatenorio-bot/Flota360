import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { TipoDocumento } from '../documento-legal.entity';

export class CreateDocumentoDto {
  @IsEnum(TipoDocumento, { message: 'Tipo debe ser SOAT o RevisionTM' })
  tipo: TipoDocumento;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Formato de fecha: YYYY-MM-DD' })
  fechaVencimiento: string;

  @IsOptional()
  @IsString()
  archivoUrl?: string;
}
