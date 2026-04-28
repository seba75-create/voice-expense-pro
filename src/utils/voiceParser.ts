export interface ParsedData {
  date: string;
  amount: number | null;
  description: string;
  category: string;
  originalText: string;
}

const CATEGORIES = ['Casa', 'Supermercado', 'Comida', 'Auto', 'Colegio', 'Otros'];

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  const normalized = dateStr.toLowerCase().trim();
  const today = new Date();

  if (normalized.includes('hoy')) {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (normalized.includes('ayer')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Handle "lunes pasado", etc. (simplified logic)
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const dayIndex = days.findIndex(d => normalized.includes(d));

  if (dayIndex !== -1 && normalized.includes('pasado')) {
    const currentDayIndex = today.getDay();
    let daysToSubtract = currentDayIndex - dayIndex;
    if (daysToSubtract <= 0) daysToSubtract += 7; // Go to previous week

    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - daysToSubtract);
    const year = pastDate.getFullYear();
    const month = String(pastDate.getMonth() + 1).padStart(2, '0');
    const day = String(pastDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fallback to today if not understood
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeCategory(catStr: string): string {
  const normalized = catStr.toLowerCase().trim();

  for (const cat of CATEGORIES) {
    if (normalized.includes(cat.toLowerCase()) || cat.toLowerCase().includes(normalized)) {
      return cat;
    }
  }

  return 'Otros';
}

export function parseVoiceInput(text: string): ParsedData {
  console.log('Parsing voice input:', text);

  // Enhanced flexible regex to handle optional $ symbol and multiple variations:
  // 1. (Optional) Date prefix
  // 2. Main action: "gasté" or "gaste"
  // 3. (Optional) $ symbol: \$?
  // 4. Amount: (\d+(?:[.,]\d+)?)
  // 5. (Optional) "pesos"
  // 6. Connector: "en"
  // 7. Description and Category logic
  const regex = /^(.*?)\s*gast[eé]\s+\$?\s*(\d+(?:[.,]\d+)?)(?:\s+pesos)?\s+en\s+(.*?)(?:\s+con\s+(?:el\s+)?tipo\s+de\s+gasto\s+(.*)|$)/i;
  const match = text.match(regex);

  if (match) {
    const [, dateRaw, amountRaw, descRaw, categoryRaw] = match;

    return {
      date: parseDate(dateRaw || 'hoy'),
      amount: parseFloat(amountRaw.replace(',', '.')),
      description: descRaw.trim(),
      category: normalizeCategory(categoryRaw || 'Otros'),
      originalText: text
    };
  }

  // Smarter Fallback: Try to extract amount even if it has a $
  const fallbackAmountRegex = /gast[eé]\s+\$?\s*(\d+(?:[.,]\d+)?)/i;
  const amountMatch = text.match(fallbackAmountRegex);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null;

  // Try to find a category in the text if full match failed
  const category = normalizeCategory(text);

  return {
    date: parseDate(text.toLowerCase().includes('ayer') ? 'ayer' : 'hoy'),
    amount,
    description: text,
    category,
    originalText: text
  };
}
