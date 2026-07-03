import prisma from '../config/prisma';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../utils/errors';
import { AppointmentStatus, PaymentStatus, Role } from '@prisma/client';
import { EmailService } from './email';
import { NotificationService } from './notification';

export class AppointmentService {
  // Helper para normalizar la fecha a las 00:00:00.000 UTC
  private static parseCleanDate(dateStr: string): Date {
    const parts = dateStr.split('-');
    return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0, 0));
  }

  // Helper para sumar minutos a una hora en formato HH:MM
  private static addMinutesToTime(timeStr: string, minutes: number): string {
    const [hours, mins] = timeStr.split(':').map(Number);
    let totalMins = hours * 60 + mins + minutes;
    
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  // Genera un rango de slots de tiempo de HH:MM a HH:MM incrementando en X minutos
  private static generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
    const slots: string[] = [];
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    for (let time = startTotal; time < endTotal; time += intervalMinutes) {
      const h = Math.floor(time / 60);
      const m = time % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }

    return slots;
  }

  // Comprueba si un slot (startTime) se solapa con una reserva de duración X
  private static isOverlap(slotStart: string, slotDuration: number, appt: { startTime: string; endTime: string }): boolean {
    const toMins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const sStart = toMins(slotStart);
    const sEnd = sStart + slotDuration;
    const aStart = toMins(appt.startTime);
    const aEnd = toMins(appt.endTime);

    return sStart < aEnd && sEnd > aStart;
  }

  static async getAvailableSlots(companyId: string, employeeId: string, dateStr: string) {
    const cleanDate = this.parseCleanDate(dateStr);
    const dayOfWeek = cleanDate.getUTCDay();

    const companyConfig = await prisma.companyConfig.findUnique({
      where: { companyId }
    });

    if (!companyConfig) return [];

    const workingHoursArray = companyConfig.workingHours as any[];
    const dayConfig = workingHoursArray.find(wh => wh.day === dayOfWeek);

    if (!dayConfig || !dayConfig.active) return [];

    // Buscar reservas agendadas
    const bookings = await prisma.appointment.findMany({
      where: {
        employeeId,
        date: cleanDate,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }
      },
      select: { startTime: true, endTime: true }
    });

    // Generar slots totales
    const allSlots = this.generateTimeSlots(dayConfig.start, dayConfig.end, companyConfig.minDurationMinutes);
    
    // Filtrar solapados
    return allSlots.filter(slot => {
      return !bookings.some(b => this.isOverlap(slot, companyConfig.minDurationMinutes, b));
    });
  }

  static async getAppointments(companyId: string, filters: {
    employeeId?: string;
    serviceId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {
      branch: { companyId }
    };

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters.serviceId) {
      where.serviceId = filters.serviceId;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = this.parseCleanDate(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = this.parseCleanDate(filters.endDate);
      }
    }

    return prisma.appointment.findMany({
      where,
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                lastname: true,
                email: true
              }
            }
          }
        },
        employee: {
          include: {
            user: {
              select: {
                name: true,
                lastname: true
              }
            }
          }
        },
        service: true,
        payment: true,
        branch: true
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });
  }

  static async getAppointmentById(id: string, companyId: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id, branch: { companyId } },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                lastname: true,
                email: true
              }
            }
          }
        },
        employee: {
          include: {
            user: {
              select: {
                name: true,
                lastname: true
              }
            }
          }
        },
        service: true,
        payment: true,
        branch: true
      }
    });

    if (!appointment) {
      throw new NotFoundError('Turno no encontrado');
    }

    return appointment;
  }

  static async createAppointment(companyId: string, userId: string, role: Role, data: {
    branchId: string;
    customerId?: string; // Requerido si reserva un admin/empleado. Si reserva un cliente se saca de su sesión.
    employeeId: string;
    serviceId: string;
    date: string;
    startTime: string;
    notes?: string | null;
    paymentMethod?: string;
  }) {
    const cleanDate = this.parseCleanDate(data.date);

    // 1. Obtener el ID del Cliente correcto
    let customerId: string;
    if (role === Role.CUSTOMER) {
      const customerProfile = await prisma.customer.findUnique({
        where: { userId }
      });
      if (!customerProfile) {
        throw new NotFoundError('No se encontró perfil de cliente para este usuario.');
      }
      customerId = customerProfile.id;
    } else {
      if (!data.customerId) {
        throw new BadRequestError('Debe especificar un cliente para reservar este turno.');
      }
      customerId = data.customerId;
    }

    // 2. Validar existencia del servicio y obtener duración y precio
    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, companyId, isActive: true }
    });
    if (!service) {
      throw new BadRequestError('El servicio seleccionado no está disponible.');
    }

    // Calcular hora de fin
    const endTime = this.addMinutesToTime(data.startTime, service.duration);

    // 3. Validar existencia y estado del empleado
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, branch: { companyId }, isActive: true },
      include: {
        user: { select: { name: true, lastname: true, id: true } }
      }
    });
    if (!employee) {
      throw new BadRequestError('El profesional seleccionado no está disponible.');
    }

    // 4. Validar que el empleado realice este servicio
    const canDoService = await prisma.employeeService.findUnique({
      where: {
        employeeId_serviceId: {
          employeeId: data.employeeId,
          serviceId: data.serviceId
        }
      }
    });
    if (!canDoService) {
      throw new BadRequestError('El profesional seleccionado no realiza el servicio solicitado.');
    }

    // 5. Validar Feriado
    const isHoliday = await prisma.holiday.findFirst({
      where: { companyId, date: cleanDate }
    });
    if (isHoliday) {
      throw new BadRequestError(`El día seleccionado es no laborable: ${isHoliday.description || 'Feriado'}`);
    }

    // 6. Validar Horario Comercial de la Empresa
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { config: true }
    });

    if (!company || !company.config) {
      throw new BadRequestError('Configuración de empresa incompleta.');
    }

    const dayOfWeek = cleanDate.getUTCDay(); // 0 = Domingo, 1 = Lunes, etc.
    const workingHoursArray = company.config.workingHours as any[];
    const dayConfig = workingHoursArray.find(wh => wh.day === dayOfWeek);

    if (!dayConfig || !dayConfig.active) {
      throw new BadRequestError('El negocio está cerrado en el día seleccionado.');
    }

    if (data.startTime < dayConfig.start || endTime > dayConfig.end) {
      throw new BadRequestError(`El horario seleccionado está fuera del rango laboral de este día (${dayConfig.start} hs a ${dayConfig.end} hs).`);
    }

    // 7. Validar Solapamiento de Turnos para el mismo empleado
    const overlapping = await prisma.appointment.findFirst({
      where: {
        employeeId: data.employeeId,
        date: cleanDate,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: data.startTime } }
        ]
      }
    });

    if (overlapping) {
      throw new ConflictError('El profesional seleccionado ya tiene un turno reservado en ese horario.');
    }

    // 8. Crear Turno y Pago asociado en una transacción
    const appointment = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.create({
        data: {
          branchId: data.branchId,
          customerId,
          employeeId: data.employeeId,
          serviceId: data.serviceId,
          date: cleanDate,
          startTime: data.startTime,
          endTime,
          status: role === Role.CUSTOMER ? AppointmentStatus.PENDING : AppointmentStatus.CONFIRMED,
          notes: data.notes
        }
      });

      // Crear el registro de Pago asociado
      await tx.payment.create({
        data: {
          appointmentId: appt.id,
          amount: service.price,
          status: PaymentStatus.PENDING,
          method: data.paymentMethod || 'CASH'
        }
      });

      return appt;
    });

    // 9. Cargar detalles completos para notificaciones
    const fullAppt = await this.getAppointmentById(appointment.id, companyId);

    // Enviar correo electrónico de confirmación (Asíncrono para no demorar la respuesta de la API)
    EmailService.sendAppointmentConfirmation({
      appointment: fullAppt,
      service: fullAppt.service,
      employee: {
        ...fullAppt.employee,
        user: {
          name: fullAppt.employee.user.name,
          lastname: fullAppt.employee.user.lastname
        }
      },
      customerUser: {
        name: fullAppt.customer.user.name,
        lastname: fullAppt.customer.user.lastname,
        email: fullAppt.customer.user.email
      },
      company
    }).catch(err => console.error('Error al enviar email de confirmación:', err));

    // Crear notificaciones internas in-app
    // Notificar al Administrador
    const adminUser = await prisma.user.findFirst({
      where: { email: company.email || '' } // El creador/email del negocio
    });
    if (adminUser) {
      await NotificationService.createNotification(
        adminUser.id,
        'Nuevo Turno Reservado',
        `El cliente ${fullAppt.customer.user.name} reservó ${service.name} para el día ${data.date} a las ${data.startTime}.`
      ).catch(e => console.error(e));
    }

    // Notificar al Empleado
    await NotificationService.createNotification(
      employee.userId,
      'Nuevo Turno Asignado',
      `Se te asignó un turno de ${service.name} el ${data.date} a las ${data.startTime}.`
    ).catch(e => console.error(e));

    return fullAppt;
  }

  static async updateAppointment(id: string, companyId: string, user: { id: string; role: Role }, data: {
    employeeId?: string;
    date?: string;
    startTime?: string;
    status?: AppointmentStatus;
    notes?: string | null;
  }) {
    const appointment = await this.getAppointmentById(id, companyId);
    
    // Si el cliente quiere modificar, validar que sea su propio turno
    if (user.role === Role.CUSTOMER) {
      const customerProfile = await prisma.customer.findUnique({
        where: { userId: user.id }
      });
      if (!customerProfile || appointment.customerId !== customerProfile.id) {
        throw new ForbiddenError('No tienes permisos para modificar este turno.');
      }

      // El cliente solo puede cancelar o reprogramar, no completar o marcar como no-show
      if (data.status && !([AppointmentStatus.CANCELLED, AppointmentStatus.PENDING] as AppointmentStatus[]).includes(data.status)) {
        throw new ForbiddenError('Estado de turno no permitido para clientes.');
      }
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { config: true }
    });

    if (!company || !company.config) {
      throw new BadRequestError('Configuración de empresa no encontrada.');
    }

    // Guardar copia de los valores anteriores para validar cambios y enviar correos
    const oldDate = new Date(appointment.date);
    const oldStartTime = appointment.startTime;
    const oldStatus = appointment.status;

    let newDate = appointment.date;
    let newStartTime = appointment.startTime;
    let newEndTime = appointment.endTime;
    let newEmployeeId = appointment.employeeId;

    let checkScheduleChange = false;

    if (data.date || data.startTime || data.employeeId) {
      checkScheduleChange = true;

      if (data.date) {
        newDate = this.parseCleanDate(data.date);
      }
      if (data.employeeId) {
        newEmployeeId = data.employeeId;
      }
      if (data.startTime) {
        newStartTime = data.startTime;
        newEndTime = this.addMinutesToTime(newStartTime, appointment.service.duration);
      } else if (data.date && !data.startTime) {
        // Si cambia de fecha pero no de hora, recalculamos hora fin por las dudas
        newEndTime = this.addMinutesToTime(newStartTime, appointment.service.duration);
      }
    }

    // Si hay un cambio de agenda (reprogramación), realizar validaciones
    if (checkScheduleChange) {
      // 1. Validar Feriado
      const isHoliday = await prisma.holiday.findFirst({
        where: { companyId, date: newDate }
      });
      if (isHoliday) {
        throw new BadRequestError(`El día seleccionado es feriado: ${isHoliday.description || 'No laborable'}`);
      }

      // 2. Validar Horario Comercial de la Empresa
      const dayOfWeek = newDate.getUTCDay();
      const workingHoursArray = company.config.workingHours as any[];
      const dayConfig = workingHoursArray.find(wh => wh.day === dayOfWeek);

      if (!dayConfig || !dayConfig.active) {
        throw new BadRequestError('El negocio está cerrado en el día seleccionado.');
      }

      if (newStartTime < dayConfig.start || newEndTime > dayConfig.end) {
        throw new BadRequestError(`El horario seleccionado está fuera del rango laboral de este día (${dayConfig.start} hs a ${dayConfig.end} hs).`);
      }

      // 3. Validar Solapamientos (excluyendo este mismo turno)
      const overlapping = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          employeeId: newEmployeeId,
          date: newDate,
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
          AND: [
            { startTime: { lt: newEndTime } },
            { endTime: { gt: newStartTime } }
          ]
        }
      });

      if (overlapping) {
        throw new ConflictError('El profesional seleccionado ya tiene un turno reservado en ese horario.');
      }
    }

    // Actualizar base de datos
    await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id },
        data: {
          employeeId: newEmployeeId,
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          status: data.status || undefined,
          notes: data.notes !== undefined ? data.notes : undefined
        }
      });

      // Si el turno se completa (COMPLETED), actualizar el pago a pagado (PAID)
      if (data.status === AppointmentStatus.COMPLETED) {
        await tx.payment.update({
          where: { appointmentId: id },
          data: { status: PaymentStatus.PAID }
        });
      }

      // Si el turno se cancela (CANCELLED), marcar el pago como reembolsado si ya estaba pagado, o cancelado
      if (data.status === AppointmentStatus.CANCELLED) {
        const payment = await tx.payment.findUnique({ where: { appointmentId: id } });
        if (payment) {
          await tx.payment.update({
            where: { appointmentId: id },
            data: { status: payment.status === PaymentStatus.PAID ? PaymentStatus.REFUNDED : PaymentStatus.PENDING }
          });
        }
      }

      return appt;
    });

    const fullAppt = await this.getAppointmentById(id, companyId);

    // Enviar correos según cambios
    if (data.status === AppointmentStatus.CANCELLED && oldStatus !== AppointmentStatus.CANCELLED) {
      EmailService.sendAppointmentCancellation({
        appointment: fullAppt,
        service: fullAppt.service,
        employee: {
          ...fullAppt.employee,
          user: {
            name: fullAppt.employee.user.name,
            lastname: fullAppt.employee.user.lastname
          }
        },
        customerUser: {
          name: fullAppt.customer.user.name,
          lastname: fullAppt.customer.user.lastname,
          email: fullAppt.customer.user.email
        },
        company
      }).catch(e => console.error(e));

      // Notificaciones internas
      await NotificationService.createNotification(
        fullAppt.employee.userId,
        'Turno Cancelado',
        `El turno de ${fullAppt.service.name} para el ${appointment.date.toLocaleDateString()} fue cancelado.`
      ).catch(e => console.error(e));
    } else if (checkScheduleChange && (oldDate.getTime() !== newDate.getTime() || oldStartTime !== newStartTime)) {
      EmailService.sendAppointmentReschedule({
        appointment: fullAppt,
        service: fullAppt.service,
        employee: {
          ...fullAppt.employee,
          user: {
            name: fullAppt.employee.user.name,
            lastname: fullAppt.employee.user.lastname
          }
        },
        customerUser: {
          name: fullAppt.customer.user.name,
          lastname: fullAppt.customer.user.lastname,
          email: fullAppt.customer.user.email
        },
        company
      }, oldDate, oldStartTime).catch(e => console.error(e));

      // Notificaciones internas
      await NotificationService.createNotification(
        fullAppt.employee.userId,
        'Turno Reprogramado',
        `Tu turno de ${fullAppt.service.name} fue reprogramado para el ${newDate.toLocaleDateString()} a las ${newStartTime}.`
      ).catch(e => console.error(e));
    }

    return fullAppt;
  }

  static async cancelAppointment(id: string, companyId: string, user: { id: string; role: Role }) {
    const appointment = await this.getAppointmentById(id, companyId);
    
    // Si cancela un cliente, verificar política de cancelación
    if (user.role === Role.CUSTOMER) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { config: true }
      });

      if (company && company.config) {
        const policyDays = company.config.cancelPolicyDays;
        if (policyDays > 0) {
          const today = new Date();
          const limitDate = new Date(appointment.date);
          // Restar los días de la política al día del turno
          limitDate.setDate(limitDate.getDate() - policyDays);
          
          if (today > limitDate) {
            throw new BadRequestError(`No se puede cancelar el turno. Las políticas del negocio exigen al menos ${policyDays} día(s) de anticipación.`);
          }
        }
      }
    }

    return this.updateAppointment(id, companyId, user, { status: AppointmentStatus.CANCELLED });
  }
}
