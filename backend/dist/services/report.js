"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const exceljs_1 = __importDefault(require("exceljs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const client_1 = require("@prisma/client");
class ReportService {
    static async getReportData(companyId, filters) {
        const where = {
            branch: { companyId }
        };
        if (filters.employeeId) {
            where.employeeId = filters.employeeId;
        }
        if (filters.startDate || filters.endDate) {
            where.date = {};
            if (filters.startDate) {
                where.date.gte = new Date(filters.startDate + 'T00:00:00.000Z');
            }
            if (filters.endDate) {
                where.date.lte = new Date(filters.endDate + 'T23:59:59.999Z');
            }
        }
        return prisma_1.default.appointment.findMany({
            where,
            include: {
                customer: { include: { user: true } },
                employee: { include: { user: true } },
                service: true,
                payment: true
            },
            orderBy: [
                { date: 'asc' },
                { startTime: 'asc' }
            ]
        });
    }
    // Genera un texto en formato CSV
    static async generateCSV(companyId, filters) {
        const appointments = await this.getReportData(companyId, filters);
        const headers = ['ID', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Cliente', 'Email Cliente', 'Servicio', 'Empleado', 'Estado', 'Monto', 'Estado Pago'];
        const rows = appointments.map(a => [
            a.id,
            a.date.toISOString().split('T')[0],
            a.startTime,
            a.endTime,
            `"${a.customer.user.name} ${a.customer.user.lastname}"`,
            a.customer.user.email,
            `"${a.service.name}"`,
            `"${a.employee.user.name} ${a.employee.user.lastname}"`,
            a.status,
            a.payment?.amount ? Number(a.payment.amount).toFixed(2) : '0.00',
            a.payment?.status || 'PENDING'
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        return csvContent;
    }
    // Genera un Buffer de Excel usando exceljs
    static async generateExcel(companyId, filters) {
        const appointments = await this.getReportData(companyId, filters);
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Turnos');
        worksheet.columns = [
            { header: 'Fecha', key: 'date', width: 15 },
            { header: 'Horario', key: 'time', width: 15 },
            { header: 'Cliente', key: 'customer', width: 25 },
            { header: 'Servicio', key: 'service', width: 25 },
            { header: 'Profesional', key: 'employee', width: 25 },
            { header: 'Estado', key: 'status', width: 15 },
            { header: 'Monto ($)', key: 'amount', width: 15 },
            { header: 'Estado Pago', key: 'paymentStatus', width: 15 }
        ];
        // Estilo para el encabezado (Stripe design: fondo oscuro, letras blancas)
        worksheet.getRow(1).font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '0F172A' } // Slate-900
        };
        appointments.forEach(a => {
            worksheet.addRow({
                date: a.date.toISOString().split('T')[0],
                time: `${a.startTime} - ${a.endTime}`,
                customer: `${a.customer.user.name} ${a.customer.user.lastname}`,
                service: a.service.name,
                employee: `${a.employee.user.name} ${a.employee.user.lastname}`,
                status: a.status,
                amount: a.payment?.amount ? Number(a.payment.amount) : 0.00,
                paymentStatus: a.payment?.status || 'PENDING'
            });
        });
        // Formatear la columna de Monto como moneda
        worksheet.getColumn('amount').numFmt = '$#,##0.00';
        const xlsxBuffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(xlsxBuffer);
    }
    // Genera un PDF de reporte corporativo usando pdfkit
    static async generatePDF(companyId, filters) {
        const appointments = await this.getReportData(companyId, filters);
        const company = await prisma_1.default.company.findUnique({ where: { id: companyId } });
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 40, size: 'A4' });
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', err => reject(err));
            // 1. Título e info de la Empresa
            doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(22).text(company?.name || 'Reporte de Turnos');
            doc.font('Helvetica').fontSize(10).fillColor('#64748B').text(`Dirección: ${company?.address || ''} | Teléfono: ${company?.phone || ''}`);
            doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString('es-AR')}`);
            doc.moveDown(1.5);
            // 2. Sección de Resumen (Métricas)
            const totalTurns = appointments.length;
            const completedTurns = appointments.filter(a => a.status === client_1.AppointmentStatus.COMPLETED).length;
            const cancelledTurns = appointments.filter(a => a.status === client_1.AppointmentStatus.CANCELLED).length;
            const totalRevenue = appointments
                .filter(a => a.status === client_1.AppointmentStatus.COMPLETED && a.payment?.status === client_1.PaymentStatus.PAID)
                .reduce((sum, a) => sum + Number(a.payment?.amount || 0), 0);
            doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(14).text('Resumen de Rendimiento');
            doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(10).fillColor('#1E293B');
            doc.text(`Total de Turnos: ${totalTurns} | Completados: ${completedTurns} | Cancelados: ${cancelledTurns}`);
            doc.font('Helvetica-Bold').text(`Ingresos Totales (Cobrados): $${totalRevenue.toFixed(2)}`);
            doc.moveDown(2);
            // 3. Tabla de Turnos
            doc.font('Helvetica-Bold').fontSize(12).fillColor('#0F172A').text('Detalle de Citas');
            doc.moveDown(0.5);
            // Encabezados de Tabla
            let tableY = doc.y;
            doc.font('Helvetica').fontSize(9).fillColor('#475569');
            doc.text('Fecha', 40, tableY, { width: 60 });
            doc.text('Horario', 100, tableY, { width: 70 });
            doc.text('Cliente', 170, tableY, { width: 110 });
            doc.text('Servicio', 280, tableY, { width: 110 });
            doc.text('Profesional', 390, tableY, { width: 100 });
            doc.text('Estado', 490, tableY, { width: 65 });
            doc.moveDown(0.5);
            doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(0.5);
            // Contenido de la Tabla
            doc.font('Helvetica').fillColor('#1E293B');
            appointments.forEach(a => {
                // Chequear salto de página automático si la tabla es muy larga
                if (doc.y > 750) {
                    doc.addPage();
                    tableY = doc.y;
                    // Re-dibujar encabezados en la nueva página
                    doc.fontSize(9).fillColor('#475569');
                    doc.text('Fecha', 40, tableY, { width: 60 });
                    doc.text('Horario', 100, tableY, { width: 70 });
                    doc.text('Cliente', 170, tableY, { width: 110 });
                    doc.text('Servicio', 280, tableY, { width: 110 });
                    doc.text('Profesional', 390, tableY, { width: 100 });
                    doc.text('Estado', 490, tableY, { width: 65 });
                    doc.moveDown(0.5);
                    doc.strokeColor('#CBD5E1').stroke();
                    doc.moveDown(0.5);
                    doc.fillColor('#1E293B');
                }
                const currentY = doc.y;
                doc.text(a.date.toISOString().split('T')[0], 40, currentY, { width: 60 });
                doc.text(`${a.startTime} hs`, 100, currentY, { width: 70 });
                doc.text(`${a.customer.user.name} ${a.customer.user.lastname.substring(0, 10)}.`, 170, currentY, { width: 110 });
                doc.text(a.service.name.substring(0, 18), 280, currentY, { width: 110 });
                doc.text(`${a.employee.user.name} ${a.employee.user.lastname.substring(0, 10)}.`, 390, currentY, { width: 100 });
                doc.text(a.status, 490, currentY, { width: 65 });
                doc.moveDown(0.8);
            });
            doc.end();
        });
    }
}
exports.ReportService = ReportService;
