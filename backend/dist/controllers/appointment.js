"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
const appointment_1 = require("../services/appointment");
const company_1 = require("../services/company");
const errors_1 = require("../utils/errors");
const client_1 = require("@prisma/client");
class AppointmentController {
    static async getCompanyIdFromUser(req) {
        if (!req.user) {
            throw new errors_1.BadRequestError('Usuario no autenticado');
        }
        const company = await company_1.CompanyService.getCompanyForUser({
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        });
        return company.id;
    }
    static async getAvailableSlots(req, res, next) {
        try {
            const employeeId = req.query.employeeId;
            const date = req.query.date;
            let companyId = req.query.companyId;
            if (!employeeId || !date) {
                throw new errors_1.BadRequestError('Falta especificar el employeeId o la fecha');
            }
            if (!companyId && req.user) {
                companyId = await AppointmentController.getCompanyIdFromUser(req);
            }
            if (!companyId) {
                const employee = await prisma_1.default.employee.findUnique({
                    where: { id: employeeId },
                    include: { branch: true }
                });
                if (!employee) {
                    throw new errors_1.NotFoundError('Profesional no encontrado');
                }
                companyId = employee.branch.companyId;
            }
            const slots = await appointment_1.AppointmentService.getAvailableSlots(companyId, employeeId, date);
            return res.status(200).json({
                status: 'success',
                data: slots
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAppointments(req, res, next) {
        try {
            let companyId;
            // Permitir obtener turnos si es un usuario autenticado (para admin/empleado sus turnos, para clientes sus turnos de esa empresa)
            if (req.user && (req.user.role === client_1.Role.ADMIN || req.user.role === client_1.Role.EMPLOYEE)) {
                companyId = await AppointmentController.getCompanyIdFromUser(req);
            }
            else {
                companyId = req.query.companyId;
                if (!companyId) {
                    throw new errors_1.BadRequestError('Falta especificar el companyId');
                }
            }
            const filters = {
                employeeId: req.query.employeeId,
                serviceId: req.query.serviceId,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };
            const appointments = await appointment_1.AppointmentService.getAppointments(companyId, filters);
            // Si es un cliente, filtrar solo sus propios turnos por seguridad
            if (req.user?.role === client_1.Role.CUSTOMER) {
                const customerProfile = await prisma_1.default.customer.findUnique({
                    where: { userId: req.user.id }
                });
                const filtered = appointments.filter(a => a.customerId === customerProfile?.id);
                return res.status(200).json({
                    status: 'success',
                    data: filtered
                });
            }
            return res.status(200).json({
                status: 'success',
                data: appointments
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAppointmentById(req, res, next) {
        try {
            const companyId = await AppointmentController.getCompanyIdFromUser(req);
            const { id } = req.params;
            const appointment = await appointment_1.AppointmentService.getAppointmentById(id, companyId);
            return res.status(200).json({
                status: 'success',
                data: appointment
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async createAppointment(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.BadRequestError('Usuario no autenticado');
            }
            let companyId;
            if (req.user.role === client_1.Role.CUSTOMER) {
                // El cliente indica la empresa a la que reserva en el body
                companyId = req.body.companyId || req.query.companyId;
                if (!companyId) {
                    // Intentar obtenerla del branch
                    const branch = await prisma_1.default.branch.findUnique({
                        where: { id: req.body.branchId }
                    });
                    if (!branch) {
                        throw new errors_1.BadRequestError('Falta especificar la empresa/sucursal');
                    }
                    companyId = branch.companyId;
                }
            }
            else {
                companyId = await AppointmentController.getCompanyIdFromUser(req);
            }
            const appointment = await appointment_1.AppointmentService.createAppointment(companyId, req.user.id, req.user.role, req.body);
            return res.status(201).json({
                status: 'success',
                data: appointment
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateAppointment(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.BadRequestError('Usuario no autenticado');
            }
            let companyId;
            if (req.user.role === client_1.Role.CUSTOMER) {
                // Encontrar empresa asociada al turno que se modifica
                const appt = await prisma_1.default.appointment.findUnique({
                    where: { id: req.params.id },
                    include: { branch: true }
                });
                if (!appt) {
                    throw new errors_1.NotFoundError('Turno no encontrado');
                }
                companyId = appt.branch.companyId;
            }
            else {
                companyId = await AppointmentController.getCompanyIdFromUser(req);
            }
            const { id } = req.params;
            const appointment = await appointment_1.AppointmentService.updateAppointment(id, companyId, { id: req.user.id, role: req.user.role }, req.body);
            return res.status(200).json({
                status: 'success',
                data: appointment
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Cancelar turno aplicando políticas
    static async cancelAppointment(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.BadRequestError('Usuario no autenticado');
            }
            const { id } = req.params;
            const appt = await prisma_1.default.appointment.findUnique({
                where: { id },
                include: { branch: true }
            });
            if (!appt) {
                throw new errors_1.NotFoundError('Turno no encontrado');
            }
            const companyId = appt.branch.companyId;
            const appointment = await appointment_1.AppointmentService.cancelAppointment(id, companyId, { id: req.user.id, role: req.user.role });
            return res.status(200).json({
                status: 'success',
                message: 'Turno cancelado correctamente',
                data: appointment
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AppointmentController = AppointmentController;
// Importación requerida para la verificación de cliente
const prisma_1 = __importDefault(require("../config/prisma"));
