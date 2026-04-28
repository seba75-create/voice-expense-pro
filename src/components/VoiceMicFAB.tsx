import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Check } from 'lucide-react';
import { parseVoiceInput, ParsedData } from '../utils/voiceParser';

interface VoiceMicFABProps {
  onSave: (data: ParsedData) => void;
}

export const VoiceMicFAB: React.FC<VoiceMicFABProps> = ({ onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'es-AR'; // Use Spanish
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setError(null);
        playBeep(800); // Higher pitch for start
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const parsed = parseVoiceInput(transcript);
        setParsedData(parsed);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setError('Error al reconocer la voz. Intenta de nuevo.');
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        playBeep(400); // Lower pitch for stop
      };
    } else {
      setError('Tu navegador no soporta reconocimiento de voz.');
    }
  }, []);

  const playBeep = (frequency: number) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Ignore audio context errors
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setParsedData(null);
      setError(null);
      recognitionRef.current.start();
    }
  };

  const handleConfirm = () => {
    if (parsedData) {
      onSave(parsedData);
      setParsedData(null);
    }
  };

  const handleCancel = () => {
    setParsedData(null);
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={toggleRecording}
          className={`relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg text-white transition-all transform hover:scale-105 active:scale-95 ${
            isRecording ? 'bg-red-500 mic-pulse' : 'bg-blue-600'
          }`}
        >
          <Mic className={`w-8 h-8 ${isRecording ? 'animate-pulse' : ''}`} />
        </button>
        {error && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full shadow-sm">
            {error}
          </div>
        )}
      </div>

      {parsedData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-blue-600 p-4 text-white text-center">
              <h3 className="font-bold text-lg">Confirmar Gasto</h3>
              <p className="text-blue-100 text-sm mt-1 opacity-80 italic">"{parsedData.originalText}"</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div className="text-slate-500">Monto:</div>
                <div className="font-bold text-slate-800">${parsedData.amount?.toFixed(2) || '0.00'}</div>
                
                <div className="text-slate-500">Descripción:</div>
                <div className="font-medium text-slate-800 capitalize">{parsedData.description}</div>
                
                <div className="text-slate-500">Categoría:</div>
                <div className="font-medium text-slate-800">{parsedData.category}</div>
                
                <div className="text-slate-500">Fecha:</div>
                <div className="font-medium text-slate-800">{parsedData.date}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-slate-100">
              <button 
                onClick={handleCancel}
                className="py-4 text-slate-500 font-medium hover:bg-slate-50 flex items-center justify-center space-x-2 transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Cancelar</span>
              </button>
              <button 
                onClick={handleConfirm}
                className="py-4 text-blue-600 font-bold hover:bg-blue-50 flex items-center justify-center space-x-2 border-l border-slate-100 transition-colors"
              >
                <Check className="w-5 h-5" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
