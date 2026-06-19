import type { Customer, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const customerRepository = {
  async listAndCount(args: {
    skip: number;
    take: number;
  }): Promise<{ rows: Customer[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.customer.findMany({
        skip: args.skip,
        take: args.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count(),
    ]);
    return { rows, total };
  },

  findById(id: number): Promise<Customer | null> {
    return prisma.customer.findUnique({ where: { id } });
  },

  create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return prisma.customer.create({ data });
  },

  update(id: number, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return prisma.customer.update({ where: { id }, data });
  },
};
