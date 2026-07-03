import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIChat: React.FC = () => {
  const { company } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `¡Hola! Soy tu asistente de Inteligencia Artificial para **${company?.name || 'tu negocio'}**. 

Puedo ayudarte a analizar estadísticas de ventas, ingresos, horarios disponibles, popularidad de servicios y el rendimiento de tus empleados en lenguaje natural.

**Prueba preguntándome:**
- ¿Qué horarios tengo disponibles mañana?
- ¿Cuál es el servicio más solicitado en el local?
- ¿Qué ingresos tuve la semana pasada?
- ¿Qué empleado atendió más personas?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setLoading(true);

    try {
      const response = await api.post('/ai/query', { question: userMsg });
      const answer = response.data.data.answer;
      
      setMessages(prev => [...prev, { role: 'assistant', content: answer, timestamp: new Date() }]);
    } catch (err: any) {
      toast.error('Error al conectar con el asistente de IA');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Ocurrió un error al procesar tu consulta. Asegúrate de tener Ollama corriendo localmente con el modelo configurado en el backend.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Reemplazo simple de formato Markdown en texto para las burbujas de chat
  const renderMessageContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Reemplazar negritas **texto**
      let formatted = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      formatted = formatted.replace(boldRegex, '<strong>$1</strong>');
      
      // Reemplazar listas - item
      if (line.trim().startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm py-0.5" dangerouslySetInnerHTML={{ __html: formatted.replace('- ', '') }} />
        );
      }
      
      // Reemplazar títulos ## Título
      if (line.trim().startsWith('## ')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-primary mt-3 mb-1" dangerouslySetInnerHTML={{ __html: formatted.replace('## ', '') }} />
        );
      }

      // Reemplazar títulos # Título
      if (line.trim().startsWith('# ')) {
        return (
          <h3 key={idx} className="text-base font-extrabold text-primary mt-4 mb-2" dangerouslySetInnerHTML={{ __html: formatted.replace('# ', '') }} />
        );
      }

      return (
        <p key={idx} className="text-sm min-h-[1.2rem]" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto border border-border dark:border-[#222226] bg-card rounded-xl overflow-hidden shadow-premium">
      {/* Cabecera Asistente */}
      <div className="p-4 border-b border-border dark:border-[#222226] flex items-center justify-between bg-muted-background/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary animate-pulse">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Asistente IA Local</h3>
            <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Ollama Engine activo
            </span>
          </div>
        </div>
      </div>

      {/* Burbujas del Chat */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            
            {/* Icono de remitente */}
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted-background border border-border dark:border-[#222226] text-muted-foreground'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Burbuja */}
            <div className={`p-4 rounded-xl text-sm leading-relaxed space-y-1.5 shadow-premium ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-none'
                : 'bg-muted-background dark:bg-[#131316] border border-border dark:border-[#1f1f23] rounded-tl-none'
            }`}>
              {renderMessageContent(msg.content)}
              <span className={`text-[9px] block text-right mt-1 opacity-60`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Indicador de procesamiento de IA */}
        {loading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="h-8 w-8 rounded-lg bg-muted-background border border-border text-muted-foreground flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-muted-background dark:bg-[#131316] border border-border dark:border-[#1f1f23] p-4 rounded-xl rounded-tl-none shadow-premium flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Procesando consulta...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Formulario de Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border dark:border-[#222226] flex gap-3 bg-muted-background/20">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: ¿Qué servicios fueron los más vendidos este mes?"
          disabled={loading}
          className="flex-1 text-sm px-4 py-2 bg-background border border-border dark:border-[#222226] rounded-lg outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all flex items-center justify-center active:scale-[0.98] disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
