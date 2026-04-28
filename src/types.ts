export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  category: string;
  synced: boolean;
  timestamp: number;
}
