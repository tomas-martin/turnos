"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
// Cargar variables de entorno
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
app_1.default.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 SERVIDOR DE TURNOS INICIADO CON ÉXITO`);
    console.log(`   Puerto: ${PORT}`);
    console.log(`   Modo:   ${process.env.NODE_ENV || 'development'}`);
    console.log(`   URL:    http://localhost:${PORT}`);
    console.log(`==================================================`);
});
