import { PrismaClient, Role, AppointmentStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el sembrado de la base de datos (Seeding)...');

  // Limpiar base de datos
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.employeeService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.companyConfig.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log('Base de datos limpiada.');

  // Contraseñas encriptadas
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const employeePasswordHash = await bcrypt.hash('empleado123', salt);
  const customerPasswordHash = await bcrypt.hash('cliente123', salt);

  // 1. Crear Empresa
  const company = await prisma.company.create({
    data: {
      name: 'Barbería Vercel',
      logoUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      address: 'Av. Santa Fe 2500, Palermo, CABA',
      phone: '+54 11 4821-9999',
      email: 'admin@turnos.com',
      timezone: 'America/Argentina/Buenos_Aires',
      primaryColor: '#0f172a', // Slate-900 (Vercel Style)
      socialLinks: {
        instagram: 'https://instagram.com/barberiavercel',
        facebook: 'https://facebook.com/barberiavercel'
      }
    }
  });

  // 2. Configuración de la Empresa
  // Horario laboral estándar: Lunes a Sábado de 09:00 a 20:00
  const workingHours = [
    { day: 1, start: '09:00', end: '20:00', active: true }, // Lunes
    { day: 2, start: '09:00', end: '20:00', active: true }, // Martes
    { day: 3, start: '09:00', end: '20:00', active: true }, // Miércoles
    { day: 4, start: '09:00', end: '20:00', active: true }, // Jueves
    { day: 5, start: '09:00', end: '20:00', active: true }, // Viernes
    { day: 6, start: '09:00', end: '18:00', active: true }, // Sábado
    { day: 0, start: '09:00', end: '13:00', active: false } // Domingo
  ];

  await prisma.companyConfig.create({
    data: {
      companyId: company.id,
      workingHours: workingHours,
      minDurationMinutes: 30,
      slotBufferMinutes: 0,
      maxAppointmentsPerSlot: 1,
      cancelPolicyDays: 1,
      cancelPolicyText: 'Las cancelaciones deben realizarse al menos 24 horas antes del turno.'
    }
  });

  // 3. Crear Sucursal
  const branch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: 'Sucursal Palermo',
      address: 'Av. Santa Fe 2500, CABA',
      phone: '+54 11 4821-9999'
    }
  });

  // 4. Crear Usuarios
  // Administrador
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@turnos.com',
      passwordHash: adminPasswordHash,
      name: 'Tomás',
      lastname: 'Gómez',
      role: Role.ADMIN
    }
  });

  // Empleados
  const empUser1 = await prisma.user.create({
    data: {
      email: 'marcos@turnos.com',
      passwordHash: employeePasswordHash,
      name: 'Marcos',
      lastname: 'Pérez',
      role: Role.EMPLOYEE
    }
  });

  const empUser2 = await prisma.user.create({
    data: {
      email: 'sofia@turnos.com',
      passwordHash: employeePasswordHash,
      name: 'Sofía',
      lastname: 'Gómez',
      role: Role.EMPLOYEE
    }
  });

  // Clientes
  const clientUser1 = await prisma.user.create({
    data: {
      email: 'juan@turnos.com',
      passwordHash: customerPasswordHash,
      name: 'Juan',
      lastname: 'Pérez',
      role: Role.CUSTOMER
    }
  });

  const clientUser2 = await prisma.user.create({
    data: {
      email: 'maria@turnos.com',
      passwordHash: customerPasswordHash,
      name: 'María',
      lastname: 'Rodríguez',
      role: Role.CUSTOMER
    }
  });

  const clientUser3 = await prisma.user.create({
    data: {
      email: 'carlos@turnos.com',
      passwordHash: customerPasswordHash,
      name: 'Carlos',
      lastname: 'García',
      role: Role.CUSTOMER
    }
  });

  // 5. Crear Perfiles de Empleado y Cliente
  const employee1 = await prisma.employee.create({
    data: {
      userId: empUser1.id,
      branchId: branch.id,
      isActive: true
    }
  });

  const employee2 = await prisma.employee.create({
    data: {
      userId: empUser2.id,
      branchId: branch.id,
      isActive: true
    }
  });

  const customer1 = await prisma.customer.create({
    data: {
      userId: clientUser1.id,
      dni: '38123456',
      phone: '+54 11 5555-1111',
      address: 'Palermo, CABA',
      observations: 'Cliente habitual, prefiere café cortado'
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      userId: clientUser2.id,
      dni: '40987654',
      phone: '+54 11 5555-2222',
      address: 'Belgrano, CABA',
      observations: 'Cabello sensible, usar shampoo neutro'
    }
  });

  const customer3 = await prisma.customer.create({
    data: {
      userId: clientUser3.id,
      dni: '35123987',
      phone: '+54 11 5555-3333',
      address: 'Recoleta, CABA',
      observations: 'Puntual'
    }
  });

  // 6. Crear Servicios
  const service1 = await prisma.service.create({
    data: {
      companyId: company.id,
      name: 'Corte de Cabello Clásico',
      description: 'Corte tradicional a tijera o máquina, incluye lavado con productos premium.',
      duration: 30,
      price: 3500.00,
      color: '#3b82f6', // Azul
      category: 'Cabello',
      isActive: true
    }
  });

  const service2 = await prisma.service.create({
    data: {
      companyId: company.id,
      name: 'Perfilado de Barba y Afeitado',
      description: 'Diseño de barba con navaja y toalla caliente para máxima relajación.',
      duration: 30,
      price: 2500.00,
      color: '#10b981', // Verde
      category: 'Barba',
      isActive: true
    }
  });

  const service3 = await prisma.service.create({
    data: {
      companyId: company.id,
      name: 'Combo Vercel (Corte + Barba)',
      description: 'Servicio completo de corte de cabello y afeitado o perfilado de barba.',
      duration: 60,
      price: 5000.00,
      color: '#8b5cf6', // Violeta
      category: 'Combos',
      isActive: true
    }
  });

  // 7. Asociar Empleados con Servicios (Muchos a Muchos)
  // Marcos hace Corte de Cabello y Combo
  await prisma.employeeService.createMany({
    data: [
      { employeeId: employee1.id, serviceId: service1.id },
      { employeeId: employee1.id, serviceId: service3.id }
    ]
  });

  // Sofía hace todos los servicios
  await prisma.employeeService.createMany({
    data: [
      { employeeId: employee2.id, serviceId: service1.id },
      { employeeId: employee2.id, serviceId: service2.id },
      { employeeId: employee2.id, serviceId: service3.id }
    ]
  });

  // 8. Crear Turnos (Pasados y Futuros)
  const today = new Date();
  
  const formatDateString = (date: Date): Date => {
    // Retorna una fecha con hora limpia UTC
    const clean = new Date(date);
    clean.setUTCHours(0, 0, 0, 0);
    return clean;
  };

  // Función auxiliar para agregar días a una fecha
  const addDays = (date: Date, days: number): Date => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  };

  console.log('Creando turnos...');

  // Turno 1: Pasado - Completado - Juan con Marcos (Corte)
  const t1 = await prisma.appointment.create({
    data: {
      branchId: branch.id,
      customerId: customer1.id,
      employeeId: employee1.id,
      serviceId: service1.id,
      date: formatDateString(addDays(today, -3)),
      startTime: '10:00',
      endTime: '10:30',
      status: AppointmentStatus.COMPLETED,
      notes: 'Excelente atención'
    }
  });

  await prisma.payment.create({
    data: {
      appointmentId: t1.id,
      amount: 3500.00,
      status: PaymentStatus.PAID,
      method: 'CASH'
    }
  });

  // Turno 2: Pasado - Completado - María con Sofía (Barba)
  const t2 = await prisma.appointment.create({
    data: {
      branchId: branch.id,
      customerId: customer2.id,
      employeeId: employee2.id,
      serviceId: service2.id,
      date: formatDateString(addDays(today, -2)),
      startTime: '11:00',
      endTime: '11:30',
      status: AppointmentStatus.COMPLETED
    }
  });

  await prisma.payment.create({
    data: {
      appointmentId: t2.id,
      amount: 2500.00,
      status: PaymentStatus.PAID,
      method: 'CARD',
      transactionId: 'TXN-992384'
    }
  });

  // Turno 3: Pasado - Cancelado - Carlos con Marcos (Combo)
  await prisma.appointment.create({
    data: {
      branchId: branch.id,
      customerId: customer3.id,
      employeeId: employee1.id,
      serviceId: service3.id,
      date: formatDateString(addDays(today, -1)),
      startTime: '16:00',
      endTime: '17:00',
      status: AppointmentStatus.CANCELLED,
      notes: 'Canceló por problemas personales.'
    }
  });

  // Turno 4: Hoy - Confirmado - Juan con Sofía (Combo)
  const t4 = await prisma.appointment.create({
    data: {
      branchId: branch.id,
      customerId: customer1.id,
      employeeId: employee2.id,
      serviceId: service3.id,
      date: formatDateString(today),
      startTime: '09:30',
      endTime: '10:30',
      status: AppointmentStatus.CONFIRMED
    }
  });

  await prisma.payment.create({
    data: {
      appointmentId: t4.id,
      amount: 5000.00,
      status: PaymentStatus.PENDING,
      method: 'TRANSFER'
    }
  });

  // Turno 5: Hoy - Pendiente - María con Marcos (Corte)
  await prisma.appointment.create({
    data: {
      branchId: branch.id,
      customerId: customer2.id,
      employeeId: employee1.id,
      serviceId: service1.id,
      date: formatDateString(today),
      startTime: '15:00',
      endTime: '15:30',
      status: AppointmentStatus.PENDING
    }
  });

  // Turno 6: Mañana - Confirmado - Carlos con Sofía (Corte)
  await prisma.appointment.create({
    data: {
      branchId: branch.id,
      customerId: customer3.id,
      employeeId: employee2.id,
      serviceId: service1.id,
      date: formatDateString(addDays(today, 1)),
      startTime: '10:30',
      endTime: '11:00',
      status: AppointmentStatus.CONFIRMED
    }
  });

  // Turno 7: Pasado mañana - Confirmado - Juan con Marcos (Corte)
  await prisma.appointment.create({
    data: {
      branchId: branch.id,
      customerId: customer1.id,
      employeeId: employee1.id,
      serviceId: service1.id,
      date: formatDateString(addDays(today, 2)),
      startTime: '14:00',
      endTime: '14:30',
      status: AppointmentStatus.CONFIRMED
    }
  });

  // 9. Crear Notificaciones
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        title: 'Nuevo Turno Reservado',
        message: 'Juan Pérez reservó un Combo Vercel para hoy a las 09:30.',
        read: false
      },
      {
        userId: adminUser.id,
        title: 'Turno Cancelado',
        message: 'Carlos García canceló su turno para ayer a las 16:00.',
        read: true
      },
      {
        userId: empUser1.id,
        title: 'Nuevo Turno Asignado',
        message: 'Tienes un nuevo turno de Corte clásico para hoy a las 15:00.',
        read: false
      }
    ]
  });

  console.log('Sembrado completado con éxito!');
}

main()
  .catch((e) => {
    console.error('Error durante el sembrado de la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
