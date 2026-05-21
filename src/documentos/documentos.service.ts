import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentoLegal } from './documento-legal.entity';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { AlertasService } from '../alertas/alertas.service';

@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(DocumentoLegal)
    private readonly repo: Repository<DocumentoLegal>,
    private readonly vehiculosService: VehiculosService,
    private readonly alertasService: AlertasService,
  ) { }

  async crear(vehiculoId: number, dto: CreateDocumentoDto): Promise<DocumentoLegal> {
    const vehiculo = await this.vehiculosService.buscarPorId(vehiculoId);

    const existe = await this.repo.findOne({
      where: { vehiculo: { id: vehiculoId }, tipo: dto.tipo },
    });
    if (existe) {
      throw new ConflictException(
        `El vehículo ya tiene un documento ${dto.tipo}. Use PATCH para actualizarlo.`,
      );
    }

    const doc = this.repo.create({
      vehiculo,
      tipo: dto.tipo,
      fechaVencimiento: dto.fechaVencimiento,
      archivoUrl: dto.archivoUrl ?? null,
    });

    const guardado = await this.repo.save(doc);
    // Evaluar alertas del documento recién creado
    await this.alertasService.evaluarAlertasDocumentos(vehiculoId);
    return guardado;
  }

  async listarPorVehiculo(vehiculoId: number): Promise<DocumentoLegal[]> {
    await this.vehiculosService.buscarPorId(vehiculoId);
    return this.repo.find({
      where: { vehiculo: { id: vehiculoId } },
      order: { tipo: 'ASC' },
    });
  }

  async actualizar(
    vehiculoId: number,
    tipo: string,
    dto: Partial<CreateDocumentoDto>,
  ): Promise<DocumentoLegal> {
    const doc = await this.repo.findOne({
      where: { vehiculo: { id: vehiculoId }, tipo: tipo as any },
    });
    if (!doc) throw new NotFoundException(`Documento ${tipo} no encontrado para este vehículo`);

    if (dto.fechaVencimiento) doc.fechaVencimiento = dto.fechaVencimiento;
    if (dto.archivoUrl) doc.archivoUrl = dto.archivoUrl;
    doc.vencido = false;

    const actualizado = await this.repo.save(doc);
    // Limpiar alertas viejas del documento y reevaluar
    await this.alertasService.limpiarAlertasDocumento(doc.id);
    await this.alertasService.evaluarAlertasDocumentos(vehiculoId);
    return actualizado;
  }
}
