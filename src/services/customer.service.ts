import type { Customer } from '@prisma/client';
import { customerRepository } from '../repositories/customer.repository';
import { NotFoundError } from '../utils/AppError';
import {
  buildPaginationMeta,
  type PaginationMeta,
  type PaginationParams,
  toSkipTake,
} from '../utils/pagination';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../schemas/customer.schema';

export interface CustomerDTO {
  id: number;
  name: string;
  phone: string;
  address: string;
  zone: string | null;
  createdAt: string;
  updatedAt: string;
}

const toDTO = (customer: Customer): CustomerDTO => ({
  id: customer.id,
  name: customer.name,
  phone: customer.phone,
  address: customer.address,
  zone: customer.zone,
  createdAt: customer.createdAt.toISOString(),
  updatedAt: customer.updatedAt.toISOString(),
});

export const customerService = {
  async list(
    pagination: PaginationParams,
  ): Promise<{ data: CustomerDTO[]; pagination: PaginationMeta }> {
    const { rows, total } = await customerRepository.listAndCount(
      toSkipTake(pagination),
    );
    return {
      data: rows.map(toDTO),
      pagination: buildPaginationMeta(pagination, total),
    };
  },

  async getById(id: number): Promise<CustomerDTO> {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new NotFoundError('Customer not found');
    return toDTO(customer);
  },

  async create(input: CreateCustomerInput): Promise<CustomerDTO> {
    const customer = await customerRepository.create({
      name: input.name,
      phone: input.phone,
      address: input.address,
      zone: input.zone ?? null,
    });
    return toDTO(customer);
  },

  async update(id: number, input: UpdateCustomerInput): Promise<CustomerDTO> {
    const existing = await customerRepository.findById(id);
    if (!existing) throw new NotFoundError('Customer not found');
    const updated = await customerRepository.update(id, input);
    return toDTO(updated);
  },
};
