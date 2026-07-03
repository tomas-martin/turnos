import nodemailer from 'nodemailer';
import { Appointment, Service, Employee, Company } from '@prisma/client';

// Configuración del transporter de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT || '2525'),
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

interface AppointmentEmailDetails {
  appointment: Appointment;
  service: Service;
  employee: Employee & { user: { name: string; lastname: string } };
  customerUser: { name: string; lastname: string; email: string };
  company: Company;
}

export class EmailService {
  private static emailFrom = process.env.EMAIL_FROM || 'no-reply@turnos-saas.com';

  private static getHTMLTemplate(title: string, bodyContent: string, actionButton?: { text: string; url: string }) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #fafafa; color: #18181b; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05); }
            .header { background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; }
            .content { padding: 32px 24px; line-height: 1.6; }
            .content h2 { margin-top: 0; font-size: 18px; font-weight: 600; color: #0f172a; }
            .details-card { background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 6px; padding: 16px; margin: 20px 0; }
            .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
            .details-row:last-child { border-bottom: none; }
            .details-label { font-weight: 500; color: #64748b; }
            .details-value { font-weight: 600; color: #0f172a; text-align: right; }
            .btn { display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: 600; border-radius: 6px; margin-top: 20px; text-align: center; font-size: 14px; }
            .footer { padding: 24px; background-color: #f4f4f5; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>turnos SaaS</h1>
            </div>
            <div class="content">
              ${bodyContent}
              ${actionButton ? `<div style="text-align: center;"><a href="${actionButton.url}" class="btn" style="color: #ffffff !important;">${actionButton.text}</a></div>` : ''}
            </div>
            <div class="footer">
              Este es un correo automático enviado por turnos. Por favor no respondas a este mensaje.
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static formatDate(date: Date): string {
    const d = new Date(date);
    // Ajustar por huso horario de Argentina si es necesario
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC' // Importante para mantener el día correcto del seed
    });
  }

  static async sendAppointmentConfirmation(details: AppointmentEmailDetails) {
    const dateStr = this.formatDate(details.appointment.date);
    const body = `
      <h2>¡Turno Confirmado!</h2>
      <p>Hola <strong>${details.customerUser.name}</strong>,</p>
      <p>Tu turno en <strong>${details.company.name}</strong> ha sido reservado correctamente. A continuación te presentamos los detalles de tu cita:</p>
      
      <div class="details-card">
        <div class="details-row">
          <span class="details-label">Servicio:</span>
          <span class="details-value">${details.service.name}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Profesional:</span>
          <span class="details-value">${details.employee.user.name} ${details.employee.user.lastname}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Fecha:</span>
          <span class="details-value">${dateStr}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Horario:</span>
          <span class="details-value">${details.appointment.startTime} hs</span>
        </div>
        <div class="details-row">
          <span class="details-label">Precio:</span>
          <span class="details-value">$${Number(details.service.price).toFixed(2)}</span>
        </div>
      </div>

      <p>Si deseas reprogramar o cancelar este turno, puedes hacerlo ingresando a tu panel de cliente desde nuestra aplicación.</p>
    `;

    const html = this.getHTMLTemplate(`Confirmación de Turno - ${details.company.name}`, body);

    try {
      await transporter.sendMail({
        from: `"${details.company.name}" <${this.emailFrom}>`,
        to: details.customerUser.email,
        subject: `Confirmación de Turno: ${details.service.name}`,
        html
      });
      console.log(`Email de confirmación enviado a ${details.customerUser.email}`);
    } catch (err) {
      console.error('Error al enviar email de confirmación:', err);
    }
  }

  static async sendAppointmentCancellation(details: AppointmentEmailDetails) {
    const dateStr = this.formatDate(details.appointment.date);
    const body = `
      <h2>Turno Cancelado</h2>
      <p>Hola <strong>${details.customerUser.name}</strong>,</p>
      <p>Te notificamos que tu turno en <strong>${details.company.name}</strong> ha sido **cancelado**.</p>
      
      <div class="details-card">
        <div class="details-row">
          <span class="details-label">Servicio:</span>
          <span class="details-value">${details.service.name}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Fecha original:</span>
          <span class="details-value">${dateStr}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Horario original:</span>
          <span class="details-value">${details.appointment.startTime} hs</span>
        </div>
      </div>

      <p>Esperamos volver a verte pronto. Puedes reservar una nueva cita en cualquier momento ingresando a nuestro portal.</p>
    `;

    const html = this.getHTMLTemplate(`Turno Cancelado - ${details.company.name}`, body);

    try {
      await transporter.sendMail({
        from: `"${details.company.name}" <${this.emailFrom}>`,
        to: details.customerUser.email,
        subject: `Turno Cancelado: ${details.service.name}`,
        html
      });
      console.log(`Email de cancelación enviado a ${details.customerUser.email}`);
    } catch (err) {
      console.error('Error al enviar email de cancelación:', err);
    }
  }

  static async sendAppointmentReschedule(details: AppointmentEmailDetails, oldDate: Date, oldStartTime: string) {
    const dateStr = this.formatDate(details.appointment.date);
    const oldDateStr = this.formatDate(oldDate);
    const body = `
      <h2>Turno Reprogramado</h2>
      <p>Hola <strong>${details.customerUser.name}</strong>,</p>
      <p>Tu turno en <strong>${details.company.name}</strong> ha sido **reprogramado**. A continuación puedes ver el cambio realizado:</p>
      
      <div class="details-card" style="border-left: 4px solid #3b82f6;">
        <h4 style="margin: 0 0 8px 0; color: #3b82f6;">Nuevo Horario</h4>
        <div class="details-row">
          <span class="details-label">Fecha:</span>
          <span class="details-value">${dateStr}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Horario:</span>
          <span class="details-value">${details.appointment.startTime} hs</span>
        </div>
      </div>

      <div class="details-card" style="opacity: 0.6;">
        <h4 style="margin: 0 0 8px 0;">Horario Anterior</h4>
        <div class="details-row">
          <span class="details-label">Fecha anterior:</span>
          <span class="details-value">${oldDateStr}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Horario anterior:</span>
          <span class="details-value">${oldStartTime} hs</span>
        </div>
      </div>

      <p>Si la nueva fecha no te es conveniente, puedes reprogramarla o cancelarla en la aplicación.</p>
    `;

    const html = this.getHTMLTemplate(`Turno Reprogramado - ${details.company.name}`, body);

    try {
      await transporter.sendMail({
        from: `"${details.company.name}" <${this.emailFrom}>`,
        to: details.customerUser.email,
        subject: `Turno Reprogramado: ${details.service.name}`,
        html
      });
      console.log(`Email de reprogramación enviado a ${details.customerUser.email}`);
    } catch (err) {
      console.error('Error al enviar email de reprogramación:', err);
    }
  }
}
