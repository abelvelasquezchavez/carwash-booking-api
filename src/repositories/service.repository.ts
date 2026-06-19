import type { Prisma, Service } from '@prisma/client';
import { prisma } from '../config/prisma';

export const serviceRepository = {
  list(filter: { isActive?: boolean }): Promise<Service[]> {
    const where: Prisma.ServiceWhereInput = {};
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    return prisma.service.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: number): Promise<Service | null> {
    return prisma.service.findUnique({ where: { id } });
  },

  create(data: Prisma.ServiceCreateInput): Promise<Service> {
    return prisma.service.create({ data });
  },

  update(id: number, data: Prisma.ServiceUpdateInput): Promise<Service> {
    return prisma.service.update({ where: { id }, data });
  },

  delete(id: number): Promise<Service> {
    return prisma.service.delete({ where: { id } });
  },
};
