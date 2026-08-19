import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DisponibilidadService } from './disponibilidad.service';
import { DocumentoLegal, TipoDocumento } from '../documentos/documento-legal.entity';
import { AsignacionConductor } from '../asignaciones/asignacion_conductor.entity';
import { PlanMantenimiento } from '../planes/plan-mantenimiento.entity';
import { OrdenTrabajo, EstadoOrden, TipoMantenimiento } from './orden-trabajo.entity';
import { BadRequestException } from '@nestjs/common';

describe('DisponibilidadService', () => {
  let service: DisponibilidadService;
  let docRepo: Repository<DocumentoLegal>;
  let asignacionRepo: Repository<AsignacionConductor>;
  let planRepo: Repository<PlanMantenimiento>;
  let ordenRepo: Repository<OrdenTrabajo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisponibilidadService,
        {
          provide: getRepositoryToken(DocumentoLegal),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AsignacionConductor),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PlanMantenimiento),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrdenTrabajo),
          useValue: {
            findOne: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DisponibilidadService>(DisponibilidadService);
    docRepo = module.get<Repository<DocumentoLegal>>(getRepositoryToken(DocumentoLegal));
    asignacionRepo = module.get<Repository<AsignacionConductor>>(getRepositoryToken(AsignacionConductor));
    planRepo = module.get<Repository<PlanMantenimiento>>(getRepositoryToken(PlanMantenimiento));
    ordenRepo = module.get<Repository<OrdenTrabajo>>(getRepositoryToken(OrdenTrabajo));
  });

  // Caso 1: Preventivo + plan válido + documentos vigentes + sin turno
  it('Caso 1: Debería permitir plan preventivo válido con documentos vigentes y sin turnos', async () => {
    jest.spyOn(docRepo, 'find').mockResolvedValue([
      { tipo: TipoDocumento.SOAT, vencido: false, fechaVencimiento: '2026-12-31' } as any,
      { tipo: TipoDocumento.REVISION_TM, vencido: false, fechaVencimiento: '2026-12-31' } as any,
    ]);
    jest.spyOn(planRepo, 'findOne').mockResolvedValue({
      id: 1,
      activo: true,
      vehiculo: { id: 10 },
    } as any);
    jest.spyOn(ordenRepo, 'findOne').mockResolvedValue(null);

    const queryBuilderMock: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    jest.spyOn(asignacionRepo, 'createQueryBuilder').mockReturnValue(queryBuilderMock);
    jest.spyOn(ordenRepo, 'count').mockResolvedValue(0);

    const result = await service.buscarFechaDisponible(10, 1, TipoMantenimiento.PREVENTIVO, '2026-08-20');
    expect(result.fecha).toBe('2026-08-20');
    expect(result.reprogramada).toBe(false);
  });

  // Caso 2: Preventivo sin plan
  it('Caso 2: Debería bloquear preventivo sin plan', async () => {
    await expect(service.validarPlanPreventivo(10, undefined)).rejects.toThrow(
      'Una orden de mantenimiento preventivo requiere un plan de mantenimiento activo asociado al vehículo seleccionado.',
    );
  });

  // Caso 3: Plan de otro vehículo
  it('Caso 3: Debería bloquear si el plan es de otro vehículo', async () => {
    jest.spyOn(planRepo, 'findOne').mockResolvedValue({
      id: 1,
      activo: true,
      vehiculo: { id: 20 }, // Pertenece a vehículo 20, solicitado es 10
    } as any);

    await expect(service.validarPlanPreventivo(10, 1)).rejects.toThrow(
      'Una orden de mantenimiento preventivo requiere un plan de mantenimiento activo asociado al vehículo seleccionado.',
    );
  });

  // Caso 4: Plan inactivo
  it('Caso 4: Debería bloquear si el plan está inactivo', async () => {
    jest.spyOn(planRepo, 'findOne').mockResolvedValue({
      id: 1,
      activo: false,
      vehiculo: { id: 10 },
    } as any);

    await expect(service.validarPlanPreventivo(10, 1)).rejects.toThrow(
      'Una orden de mantenimiento preventivo requiere un plan de mantenimiento activo asociado al vehículo seleccionado.',
    );
  });

  // Caso 5 y 6: Plan con OT Abierta / En proceso
  it('Caso 5 y 6: Debería bloquear si el plan tiene OT pendiente', async () => {
    jest.spyOn(planRepo, 'findOne').mockResolvedValue({
      id: 1,
      activo: true,
      vehiculo: { id: 10 },
    } as any);
    jest.spyOn(ordenRepo, 'findOne').mockResolvedValue({ id: 99, estado: EstadoOrden.ABIERTA } as any);

    await expect(service.validarPlanPreventivo(10, 1)).rejects.toThrow(
      'El plan de mantenimiento seleccionado ya tiene una orden de trabajo pendiente.',
    );
  });

  // Caso 7: SOAT vencido hoy
  it('Caso 7: Debería bloquear si el SOAT está vencido', async () => {
    jest.spyOn(docRepo, 'find').mockResolvedValue([
      { tipo: TipoDocumento.SOAT, vencido: true, fechaVencimiento: '2026-08-10' } as any,
    ]);

    await expect(service.validarDocumentos(10, '2026-08-20')).rejects.toThrow(
      'El vehículo no puede ser programado porque tiene el SOAT vencido.',
    );
  });

  // Caso 8: RTM vencida hoy
  it('Caso 8: Debería bloquear si la RTM está vencida', async () => {
    jest.spyOn(docRepo, 'find').mockResolvedValue([
      { tipo: TipoDocumento.REVISION_TM, vencido: false, fechaVencimiento: '2026-08-01' } as any, // fecha vencimiento anterior a hoy (simulando hoy 2026-08-18)
    ]);

    await expect(service.validarDocumentos(10, '2026-08-20')).rejects.toThrow(
      'El vehículo no puede ser programado porque tiene la RTM vencida.',
    );
  });

  // Caso 9: Preventivo con turno -> siguiente fecha disponible
  it('Caso 9: Debería buscar fecha disponible si hay turno en la fecha solicitada', async () => {
    jest.spyOn(docRepo, 'find').mockResolvedValue([
      { tipo: TipoDocumento.SOAT, vencido: false, fechaVencimiento: '2026-12-31' } as any,
    ]);

    // Simular que el día 20 tiene turno, y el día 21 está libre
    const queryBuilderMock1: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn()
        .mockResolvedValueOnce({ id: 1 }) // turno el 20/08
        .mockResolvedValueOnce(null),    // libre el 21/08
    };
    jest.spyOn(asignacionRepo, 'createQueryBuilder').mockReturnValue(queryBuilderMock1);
    jest.spyOn(ordenRepo, 'count').mockResolvedValue(0);

    const result = await service.buscarFechaDisponible(10, 1, TipoMantenimiento.PREVENTIVO, '2026-08-20');
    expect(result.fecha).toBe('2026-08-21');
    expect(result.reprogramada).toBe(true);
    expect(result.motivo).toBe('VEHICULO_CON_TURNO');
  });

  // Caso 10: Preventivo con varios días ocupados
  it('Caso 10: Debería continuar buscando sobre varios días con turnos', async () => {
    jest.spyOn(docRepo, 'find').mockResolvedValue([
      { tipo: TipoDocumento.SOAT, vencido: false, fechaVencimiento: '2026-12-31' } as any,
    ]);

    const queryBuilderMock: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn()
        .mockResolvedValueOnce({ id: 1 }) // 20/08 ocupado
        .mockResolvedValueOnce({ id: 2 }) // 21/08 ocupado
        .mockResolvedValueOnce(null),    // 22/08 libre
    };
    jest.spyOn(asignacionRepo, 'createQueryBuilder').mockReturnValue(queryBuilderMock);
    jest.spyOn(ordenRepo, 'count').mockResolvedValue(0);

    const result = await service.buscarFechaDisponible(10, 1, TipoMantenimiento.PREVENTIVO, '2026-08-20');
    expect(result.fecha).toBe('2026-08-22');
    expect(result.reprogramada).toBe(true);
  });

  // Caso 11: Correctivo con turno -> mantener fecha
  it('Caso 11: Debería mantener la fecha si es correctivo aunque tenga turno', async () => {
    jest.spyOn(docRepo, 'find').mockResolvedValue([
      { tipo: TipoDocumento.SOAT, vencido: false, fechaVencimiento: '2026-12-31' } as any,
    ]);

    const result = await service.buscarFechaDisponible(10, null, TipoMantenimiento.CORRECTIVO, '2026-08-20');
    expect(result.fecha).toBe('2026-08-20');
    expect(result.reprogramada).toBe(false);
  });

  // Caso 12: Correctivo sin turno -> crear
  it('Caso 12: Debería permitir correctivo sin turno', async () => {
    jest.spyOn(docRepo, 'find').mockResolvedValue([
      { tipo: TipoDocumento.SOAT, vencido: false, fechaVencimiento: '2026-12-31' } as any,
    ]);

    const result = await service.buscarFechaDisponible(10, null, TipoMantenimiento.CORRECTIVO, '2026-08-20');
    expect(result.fecha).toBe('2026-08-20');
  });

  // Caso 13: Correctivo con documento vencido -> bloquear
  it('Caso 13: Debería bloquear correctivo si hay documento vencido', async () => {
    jest.spyOn(docRepo, 'find').mockResolvedValue([
      { tipo: TipoDocumento.SOAT, vencido: true, fechaVencimiento: '2026-08-10' } as any,
    ]);

    await expect(
      service.buscarFechaDisponible(10, null, TipoMantenimiento.CORRECTIVO, '2026-08-20'),
    ).rejects.toThrow('El vehículo no puede ser programado porque tiene el SOAT vencido.');
  });
});
