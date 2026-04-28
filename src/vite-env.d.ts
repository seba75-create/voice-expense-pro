/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

// Global interface for Expense
interface Expense {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  synced: boolean;
  timestamp: number;
}
