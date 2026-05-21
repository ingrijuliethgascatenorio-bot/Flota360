import { CreateAsignacionDto } from './create.asignacion.dto';
declare const UpdateAsignacionDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateAsignacionDto>>;
export declare class UpdateAsignacionDto extends UpdateAsignacionDto_base {
    activo?: boolean;
}
export {};
