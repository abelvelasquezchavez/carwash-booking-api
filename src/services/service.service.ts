import { Prisma, type Service } from '@prisma/client';
import { serviceRepository } from '../repositories/service.repository';
import { NotFoundError } from '../utils/AppError';
import type {
  CreateServiceInput,
  ListServicesQuery,
  UpdateServiceInput,
} from '../schemas/service.schema';

export interface ServiceDTO {
  id: number;
  name: string;
  description: string | null;
  price: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const toDTO = (service: Service): ServiceDTO => ({
  id: service.id,
  name: service.name,
  description: service.description,
  // Decimal -> string keeps money exact (no float rounding).
  price: service.price.toFixed(2),
  durationMinutes: service.durationMinutes,
  isActive: service.isActive,
  createdAt: service.createdAt.toISOString(),
  updatedAt: service.updatedAt.toISOString(),
});

export const serviceService = {
  async list(query: ListServicesQuery): Promise<ServiceDTO[]> {
    const services = await serviceRepository.list(
      query.active === undefined ? {} : { isActive: query.active },
    );
    return services.map(toDTO);
  },

  async getById(id: number): Promise<ServiceDTO> {
    const service = await serviceRepository.findById(id);
    if (!service) throw new NotFoundError('Service not found');
    return toDTO(service);
  },

  async create(input: CreateServiceInput): Promise<ServiceDTO> {
    const service = await serviceRepository.create({
      name: input.name,
      description: input.description ?? null,
      price: new Prisma.Decimal(input.price),
      durationMinutes: input.durationMinutes,
      isActive: input.isActive ?? true,
    });
    return toDTO(service);
  },

  async update(id: number, input: UpdateServiceInput): Promise<ServiceDTO> {
    const existing = await serviceRepository.findById(id);
    if (!existing) throw new NotFoundError('Service not found');

    const data: Prisma.ServiceUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
    if (input.durationMinutes !== undefined)
      data.durationMinutes = input.durationMinutes;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const updated = await serviceRepository.update(id, data);
    return toDTO(updated);
  },

  async remove(id: number): Promise<void> {
    const existing = await serviceRepository.findById(id);
    if (!existing) throw new NotFoundError('Service not found');
    await serviceRepository.delete(id);
  },
};
