import { CreateVehiculoDto } from './create-vehiculo.dto';
declare const UpdateVehiculoDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateVehiculoDto>>;
export declare class UpdateVehiculoDto extends UpdateVehiculoDto_base {
    activo?: boolean;
}
export {};
