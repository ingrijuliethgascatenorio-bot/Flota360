import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './vehiculo.entity';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { DocumentoLegal, TipoDocumento } from '../documentos/documento-legal.entity';
import { AlertasService } from '../alertas/alertas.service';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly repo: Repository<Vehiculo>,
    @InjectRepository(DocumentoLegal)
    private readonly documentoRepo: Repository<DocumentoLegal>,
    private readonly alertasService: AlertasService,
  ) {}

  async crear(dto: CreateVehiculoDto): Promise<Vehiculo> {
    const existe = await this.repo.findOne({
      where: { placa: dto.placa.toUpperCase() },
    });
    if (existe)
      throw new ConflictException(
        `Ya existe un vehículo con la placa ${dto.placa}`,
      );

    const { venceSoat, venceTecnomecanica, ...vehiculoData } = dto;

    const vehiculo = this.repo.create({
      ...vehiculoData,
      placa: dto.placa.toUpperCase(),
    });
    
    const guardado = await this.repo.save(vehiculo);

    await this.documentoRepo.save(this.documentoRepo.create({
      vehiculo: guardado,
      tipo: TipoDocumento.SOAT,
      fechaVencimiento: venceSoat,
    }));

    await this.documentoRepo.save(this.documentoRepo.create({
      vehiculo: guardado,
      tipo: TipoDocumento.REVISION_TM,
      fechaVencimiento: venceTecnomecanica,
    }));

    await this.alertasService.evaluarAlertasDocumentos(guardado.id);

    return this.buscarPorId(guardado.id);
  }

  async listar(): Promise<Vehiculo[]> {
    return this.repo.find({
      where: { activo: true },
      order: { createdAt: 'DESC' },
    });
  }

  async buscarPorId(id: number): Promise<Vehiculo> {
    const vehiculo = await this.repo.findOne({
      where: { id },
      relations: ['documentos'],
    });
    if (!vehiculo) throw new NotFoundException(`Vehículo #${id} no encontrado`);
    return vehiculo;
  }

  async actualizar(id: number, dto: UpdateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = await this.buscarPorId(id);

    if (dto.placa && dto.placa.toUpperCase() !== vehiculo.placa) {
      const existe = await this.repo.findOne({
        where: { placa: dto.placa.toUpperCase() },
      });
      if (existe)
        throw new ConflictException(`La placa ${dto.placa} ya está registrada`);
    }

    const { venceSoat, venceTecnomecanica, ...vehiculoData } = dto;

    Object.assign(vehiculo, {
      ...vehiculoData,
      placa: dto.placa ? dto.placa.toUpperCase() : vehiculo.placa,
    });

    const guardado = await this.repo.save(vehiculo);

    if (venceSoat) {
      const docSoat = await this.documentoRepo.findOne({
        where: { vehiculo: { id }, tipo: TipoDocumento.SOAT },
      });
      if (docSoat) {
        docSoat.fechaVencimiento = venceSoat;
        await this.documentoRepo.save(docSoat);
      } else {
        await this.documentoRepo.save(
          this.documentoRepo.create({
            vehiculo: guardado,
            tipo: TipoDocumento.SOAT,
            fechaVencimiento: venceSoat,
          }),
        );
      }
    }

    if (venceTecnomecanica) {
      const docTM = await this.documentoRepo.findOne({
        where: { vehiculo: { id }, tipo: TipoDocumento.REVISION_TM },
      });
      if (docTM) {
        docTM.fechaVencimiento = venceTecnomecanica;
        await this.documentoRepo.save(docTM);
      } else {
        await this.documentoRepo.save(
          this.documentoRepo.create({
            vehiculo: guardado,
            tipo: TipoDocumento.REVISION_TM,
            fechaVencimiento: venceTecnomecanica,
          }),
        );
      }
    }

    if (venceSoat || venceTecnomecanica) {
      await this.alertasService.evaluarAlertasDocumentos(id);
    }

    return this.buscarPorId(id);
  }

  async eliminar(id: number): Promise<void> {
    const vehiculo = await this.buscarPorId(id);
    vehiculo.activo = false;
    await this.repo.save(vehiculo);
  }
}
