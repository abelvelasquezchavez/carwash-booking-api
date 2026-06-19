import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
} from '@prisma/client';
// Reuse the real auth hashing so the seeded admin can actually log in.
import { hashPassword } from '../src/utils/bcrypt';

const prisma = new PrismaClient();

const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * 60_000);

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Clean slate, in FK-safe order (payments -> bookings -> the rest).
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  // ── Admin (the grandfather) ───────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'abuelo@carwash.com',
      password: await hashPassword('carwash123'),
    },
  });

  // ── Service catalogue ───────────────────────────────────────────────────────
  const basico = await prisma.service.create({
    data: {
      name: 'Lavado Básico',
      description: 'Lavado exterior a mano con secado.',
      price: '25.00',
      durationMinutes: 30,
    },
  });
  const completo = await prisma.service.create({
    data: {
      name: 'Lavado Completo',
      description: 'Exterior + interior básico: aspirado y limpieza de tablero.',
      price: '45.00',
      durationMinutes: 60,
    },
  });
  const encerado = await prisma.service.create({
    data: {
      name: 'Encerado',
      description: 'Encerado y abrillantado de carrocería.',
      price: '60.00',
      durationMinutes: 90,
    },
  });
  const interiores = await prisma.service.create({
    data: {
      name: 'Limpieza de Interiores',
      description: 'Limpieza profunda de tapizados, alfombras y plásticos.',
      price: '50.00',
      durationMinutes: 75,
    },
  });

  // ── Customers ─────────────────────────────────────────────────────────────
  const rosa = await prisma.customer.create({
    data: {
      name: 'Doña Rosa Quispe',
      phone: '+51 999 888 777',
      address: 'Av. Siempreviva 742',
      zone: 'Centro',
    },
  });
  const pepe = await prisma.customer.create({
    data: {
      name: 'Don Pepe Huamán',
      phone: '+51 955 444 333',
      address: 'Jr. Las Begonias 120, Dpto. 302',
      zone: 'Surco',
    },
  });

  // ── Bookings (mix of statuses + paid/unpaid for the reports) ────────────────
  // 1) Completed & PAID in cash -> feeds revenue.
  const start1 = new Date('2026-06-10T09:00:00.000Z');
  await prisma.booking.create({
    data: {
      startTime: start1,
      endTime: addMinutes(start1, completo.durationMinutes),
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      amount: completo.price,
      notes: 'Cliente frecuente, dejó la cochera abierta.',
      createdAt: new Date('2026-06-10T08:00:00.000Z'),
      service: { connect: { id: completo.id } },
      customer: { connect: { id: rosa.id } },
      payment: {
        create: {
          method: PaymentMethod.CASH,
          amount: completo.price,
          paidAt: new Date('2026-06-10T10:05:00.000Z'),
          notes: 'Pagó en efectivo al terminar.',
        },
      },
    },
  });

  // 2) Completed & PAID via Yape -> revenue, different method.
  const start2 = new Date('2026-06-16T08:00:00.000Z');
  await prisma.booking.create({
    data: {
      startTime: start2,
      endTime: addMinutes(start2, basico.durationMinutes),
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      amount: basico.price,
      createdAt: new Date('2026-06-16T07:30:00.000Z'),
      service: { connect: { id: basico.id } },
      customer: { connect: { id: pepe.id } },
      payment: {
        create: {
          method: PaymentMethod.YAPE,
          amount: basico.price,
          paidAt: new Date('2026-06-16T08:35:00.000Z'),
        },
      },
    },
  });

  // 3) Completed but UNPAID -> an outstanding receivable.
  const start3 = new Date('2026-06-12T14:00:00.000Z');
  await prisma.booking.create({
    data: {
      startTime: start3,
      endTime: addMinutes(start3, interiores.durationMinutes),
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.UNPAID,
      amount: interiores.price,
      notes: 'Quedó en pagar por transferencia el fin de semana.',
      createdAt: new Date('2026-06-12T13:00:00.000Z'),
      service: { connect: { id: interiores.id } },
      customer: { connect: { id: rosa.id } },
    },
  });

  // 4) Confirmed & UNPAID, in the future.
  const start4 = new Date('2026-06-25T11:00:00.000Z');
  await prisma.booking.create({
    data: {
      startTime: start4,
      endTime: addMinutes(start4, encerado.durationMinutes),
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.UNPAID,
      amount: encerado.price,
      createdAt: new Date('2026-06-17T09:00:00.000Z'),
      service: { connect: { id: encerado.id } },
      customer: { connect: { id: pepe.id } },
    },
  });

  // 5) Pending & UNPAID, in the future.
  const start5 = new Date('2026-06-28T16:00:00.000Z');
  await prisma.booking.create({
    data: {
      startTime: start5,
      endTime: addMinutes(start5, basico.durationMinutes),
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      amount: basico.price,
      createdAt: new Date('2026-06-18T18:00:00.000Z'),
      service: { connect: { id: basico.id } },
      customer: { connect: { id: rosa.id } },
    },
  });

  // 6) Cancelled -> frees the slot, never counts as a receivable.
  const start6 = new Date('2026-06-18T10:00:00.000Z');
  await prisma.booking.create({
    data: {
      startTime: start6,
      endTime: addMinutes(start6, encerado.durationMinutes),
      status: BookingStatus.CANCELLED,
      paymentStatus: PaymentStatus.UNPAID,
      amount: encerado.price,
      notes: 'El cliente reprogramó.',
      createdAt: new Date('2026-06-15T12:00:00.000Z'),
      service: { connect: { id: encerado.id } },
      customer: { connect: { id: pepe.id } },
    },
  });

  console.log('✅ Seed complete:');
  console.log(`   • Admin:     ${admin.email}  (password: carwash123)`);
  console.log('   • Services:  4 (Básico, Completo, Encerado, Interiores)');
  console.log('   • Customers: 2 (Doña Rosa, Don Pepe)');
  console.log('   • Bookings:  6 (2 paid, 3 unpaid, 1 cancelled)');
  console.log('   • Revenue:   CASH 45.00 + YAPE 25.00 = 70.00');
  console.log('   • Pending:   3 receivables totalling 135.00');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('❌ Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
