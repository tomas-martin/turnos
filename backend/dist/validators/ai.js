"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiQuerySchema = void 0;
const zod_1 = require("zod");
exports.aiQuerySchema = zod_1.z.object({
    body: zod_1.z.object({
        question: zod_1.z.string().min(2, 'La consulta debe tener al menos 2 caracteres')
    })
});
