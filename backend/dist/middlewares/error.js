"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const zod_1 = require("zod");
const errorHandler = (err, req, res, _next) => {
    // En desarrollo mostramos el stack trace, en producción podríamos guardarlo en logs
    console.error(`[Error Handler] Path: ${req.path} - Error: ${err.message}`);
    if (err.stack) {
        console.error(err.stack);
    }
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            status: 'error',
            message: 'Error de validación',
            errors: err.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
            }))
        });
    }
    // Error de base de datos de Prisma u otros errores inesperados
    return res.status(500).json({
        status: 'error',
        message: 'Ocurrió un error interno en el servidor'
    });
};
exports.errorHandler = errorHandler;
