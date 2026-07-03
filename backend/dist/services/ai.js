"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const axios_1 = __importDefault(require("axios"));
const aiStats_1 = require("./aiStats");
class AIService {
    static getOllamaUrl() {
        return process.env.OLLAMA_URL || 'http://localhost:11434';
    }
    static getOllamaModel() {
        return process.env.OLLAMA_MODEL || 'qwen2.5:1.5b';
    }
    static async queryAI(companyId, userQuestion) {
        try {
            // 1. Obtener las estadísticas actuales del negocio en tiempo real
            const stats = await aiStats_1.AIStatsService.getBusinessSummary(companyId);
            // 2. Definir el System Prompt para guiar las respuestas
            const systemPrompt = `
Eres el asistente virtual inteligente de la plataforma SaaS "turnos".
Tu trabajo es responder las preguntas del administrador sobre el estado de su negocio basándote ÚNICAMENTE en el contexto consolidado que te proporcionamos abajo.

Instrucciones críticas:
1. Responde en español de forma profesional, clara y concisa (estilo Notion/Linear).
2. Si te preguntan por horarios disponibles, ingresos, clientes nuevos, servicios más solicitados o desempeño de empleados, usa EXACTAMENTE los números del contexto provisto.
3. Si el contexto no contiene información para responder la pregunta (por ejemplo, preguntas sobre fechas muy lejanas, datos de contacto no listados o temas fuera del negocio), responde educadamente explicando que no dispones de esa información en este momento. No inventes datos (cero alucinaciones).

CONTEXTO REAL DEL NEGOCIO:
${stats.contextMarkdown}
`;
            const ollamaUrl = this.getOllamaUrl();
            const model = this.getOllamaModel();
            console.log(`[AI Query] Enviando consulta a Ollama en ${ollamaUrl} usando modelo ${model}`);
            // 3. Llamar a Ollama
            const response = await axios_1.default.post(`${ollamaUrl}/api/chat`, {
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userQuestion }
                ],
                stream: false
            }, {
                timeout: 15000 // Timeout de 15 segundos
            });
            if (response.data && response.data.message && response.data.message.content) {
                return response.data.message.content.trim();
            }
            throw new Error('Formato de respuesta inesperado de Ollama');
        }
        catch (error) {
            console.error('[AI Query Error] Error al comunicarse con Ollama:', error.message);
            // Manejar casos de conexión caída con mensajes amigables e instructivos
            if (error.code === 'ECONNREFUSED' || error.message.includes('timeout')) {
                return `⚠️ **El Asistente de IA local no responde.**

Para utilizar esta funcionalidad, asegúrate de:
1. Tener **Ollama** instalado y ejecutándose en tu computadora.
2. Iniciar el servicio (usualmente corre en \`http://localhost:11434\`).
3. Haber descargado el modelo configurado ejecutando en tu terminal:
   \`\`\`bash
   ollama run qwen2.5:1.5b
   \`\`\`
*(Puedes cambiar el modelo o la dirección de Ollama en el archivo \`.env\` del backend).*`;
            }
            return `Ocurrió un error al procesar tu consulta con la IA: ${error.message}`;
        }
    }
}
exports.AIService = AIService;
