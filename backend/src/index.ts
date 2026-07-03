import dotenv from 'dotenv';
import app from './app';

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 SERVIDOR DE TURNOS INICIADO CON ÉXITO`);
  console.log(`   Puerto: ${PORT}`);
  console.log(`   Modo:   ${process.env.NODE_ENV || 'development'}`);
  console.log(`   URL:    http://localhost:${PORT}`);
  console.log(`==================================================`);
});
