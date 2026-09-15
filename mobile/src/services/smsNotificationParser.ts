export interface ParsedFinancialMessage {
  institution: 'M-Pesa' | 'e-Mola' | 'Millennium BIM' | 'Access Bank' | 'Outro';
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  currency: string;
  storeOrRecipient: string;
  description: string;
  category: string;
  isEssential: boolean;
  date: string;
  referenceId?: string;
  rawMessage: string;
}

/**
 * Motor de parsing inteligente de SMS e notificações bancárias e de Mobile Money de Moçambique.
 * Suporta remetentes oficiais:
 * - Millennium BIM (+842424, 842424, MBIM, IZI, BIM, Millennium)
 * - M-Pesa (M-Pesa, MPESA, 8484, Vodacom)
 * - e-Mola (e-Mola, eMola, 8686, 8787, Movitel)
 * - Access Bank (AccessBank, Access Bank, AccessBankMZ)
 */
export function parseFinancialNotification(message: string, senderHeader?: string): ParsedFinancialMessage | null {
  if (!message || message.trim().length === 0) return null;

  const clean = message.trim();
  const lower = (clean + ' ' + (senderHeader || '')).toLowerCase();

  // 1. Identificação da Instituição e Remetente
  let institution: ParsedFinancialMessage['institution'] = 'Outro';
  if (
    lower.includes('+842424') ||
    lower.includes('842424') ||
    lower.includes('mbim') ||
    lower.includes('millennium') ||
    lower.includes('millennium bim') ||
    lower.includes('izi') ||
    (lower.includes('bim') && !lower.includes('kombim'))
  ) {
    institution = 'Millennium BIM';
  } else if (
    lower.includes('m-pesa') ||
    lower.includes('mpesa') ||
    lower.includes('8484') ||
    lower.includes('vodacom')
  ) {
    institution = 'M-Pesa';
  } else if (
    lower.includes('e-mola') ||
    lower.includes('emola') ||
    lower.includes('8686') ||
    lower.includes('8787') ||
    lower.includes('movitel')
  ) {
    institution = 'e-Mola';
  } else if (
    lower.includes('access') ||
    lower.includes('accessbank') ||
    lower.includes('access bank') ||
    lower.includes('accessbankmz')
  ) {
    institution = 'Access Bank';
  }

  // 2. Deteção de Tipo (Entrada / Saída / Transferência)
  let type: 'expense' | 'income' | 'transfer' = 'expense';
  if (
    lower.includes('recebido') ||
    lower.includes('recebeste') ||
    lower.includes('creditado') ||
    lower.includes('credito') ||
    lower.includes('deposito') ||
    lower.includes('salario')
  ) {
    type = 'income';
  } else if (lower.includes('transferiste') || lower.includes('transferiu') || lower.includes('transferencia enviada')) {
    type = 'transfer';
  }

  // 3. Extração de Montante em Meticais (MT / MZN)
  let amount = 0;
  const amountMatch = clean.match(
    /(?:valor\s+de\s+|de\s+|pagaste\s+|transferiste\s+|transferiu\s+|levantaste\s+|compra\s+no\s+pos\s+de\s+|compra\s+de\s+|recebido\s+|debito\s+de\s+|credito\s+de\s+|pagamento\s+de\s+)?(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:mt|mzn|meticais)/i
  );

  if (amountMatch) {
    const rawNum = amountMatch[1].replace(/\s/g, '').replace(',', '.');
    amount = parseFloat(rawNum);
  } else {
    const fallbackMatch = clean.match(/(\d+(?:[.,]\d{2})?)\s*(?:mt|mzn)/i);
    if (fallbackMatch) {
      amount = parseFloat(fallbackMatch[1].replace(',', '.'));
    }
  }

  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  // 4. Extração do Estabelecimento / Destinatário / Origem
  let storeOrRecipient = 'Serviço / Estabelecimento';
  let description = type === 'income' ? 'Entrada de Dinheiro' : 'Despesa registada via SMS';
  let isEssential = true;
  let category = 'essential';

  if (institution === 'Millennium BIM') {
    if (type === 'income') {
      const matchSender = clean.match(/(?:recebida\s+de\s+|de\s+)([^.,]+?)(?:\s+em|\.|$)/i);
      storeOrRecipient = matchSender ? matchSender[1].trim() : 'Transferência Recebida BIM';
      description = `Crédito BIM: ${storeOrRecipient}`;
    } else if (type === 'transfer') {
      const matchDest = clean.match(/(?:para\s+)([^.,]+?)(?:\s+em|\.|\s+saldo|$)/i);
      storeOrRecipient = matchDest ? matchDest[1].trim() : 'Destinatário Transferência';
      description = `Transferência BIM: ${storeOrRecipient}`;
      isEssential = false;
      category = 'lifestyle';
    } else if (lower.includes('levantamento')) {
      storeOrRecipient = 'ATM BIM';
      description = 'Levantamento ATM BIM';
      isEssential = true;
    } else {
      const matchPos = clean.match(/(?:no\s+estabelecimento\s+|no\s+pos\s+de\s+|em\s+)([^.,]+?)(?:\s+em|\s+com\s+cartao|\s+cartao|\.|\s+saldo|$)/i);
      if (matchPos) storeOrRecipient = matchPos[1].trim();
      description = `BIM (+842424): ${storeOrRecipient}`;
    }
  } else if (institution === 'M-Pesa') {
    if (type === 'income') {
      const matchSender = clean.match(/(?:de\s+\d+\s*-\s*|de\s+)([^.,]+?)(?:\s+em|\.|$)/i);
      storeOrRecipient = matchSender ? matchSender[1].trim() : 'Remetente M-Pesa';
      description = `Recebido M-Pesa de ${storeOrRecipient}`;
    } else if (lower.includes('pagaste') || lower.includes('pagamento')) {
      const matchStore = clean.match(/(?:a\s+\d+\s*-\s*|para\s+)([^.,]+?)(?:\s+em|\s+efectuado|\.|$)/i);
      if (matchStore) storeOrRecipient = matchStore[1].trim();
      description = `Pagamento M-Pesa: ${storeOrRecipient}`;
    } else if (lower.includes('transferiste')) {
      const matchPerson = clean.match(/(?:para\s+\d+\s*-\s*|para\s+)([^.,]+?)(?:\s+em|\.|$)/i);
      if (matchPerson) storeOrRecipient = matchPerson[1].trim();
      description = `Transferência M-Pesa: ${storeOrRecipient}`;
      isEssential = false;
      category = 'lifestyle';
    } else if (lower.includes('levantaste')) {
      storeOrRecipient = 'Agente M-Pesa';
      description = 'Levantamento M-Pesa';
      isEssential = true;
    }
  } else if (institution === 'e-Mola') {
    if (type === 'income') {
      const matchSender = clean.match(/(?:de\s+\d+\s*-\s*|de\s+)([^.,]+?)(?:\s+no\s+dia|\.|$)/i);
      storeOrRecipient = matchSender ? matchSender[1].trim() : 'Remetente e-Mola';
      description = `Recebido e-Mola de ${storeOrRecipient}`;
    } else if (lower.includes('transferiu')) {
      const matchPerson = clean.match(/(?:para\s+\d+\s*-\s*|para\s+)([^.,]+?)(?:\s+no\s+dia|\.|$)/i);
      if (matchPerson) storeOrRecipient = matchPerson[1].trim();
      description = `Transferência e-Mola: ${storeOrRecipient}`;
      isEssential = false;
      category = 'lifestyle';
    } else if (lower.includes('pagamento')) {
      const matchStore = clean.match(/(?:para\s+)([^.,]+?)(?:\s+efectuado|\.|$)/i);
      if (matchStore) storeOrRecipient = matchStore[1].trim();
      description = `Pagamento e-Mola: ${storeOrRecipient}`;
    }
  } else if (institution === 'Access Bank') {
    if (type === 'income') {
      storeOrRecipient = 'Crédito em Conta Access Bank';
      description = 'Crédito Access Bank';
    } else if (type === 'transfer') {
      const matchDest = clean.match(/(?:para\s+)([^.,]+?)(?:\s+em|\.|\s+saldo|$)/i);
      storeOrRecipient = matchDest ? matchDest[1].trim() : 'Destinatário Transferência';
      description = `Transferência Access Bank: ${storeOrRecipient}`;
      isEssential = false;
      category = 'lifestyle';
    } else {
      const matchPos = clean.match(/(?:pos\s*-\s*|no\s+pos\s+de\s+|para\s+|em\s+)([^.,]+?)(?:\s+no\s+cartao|\s+em|\.|\s+saldo|$)/i);
      if (matchPos) storeOrRecipient = matchPos[1].trim();
      description = `Cartão Access Bank: ${storeOrRecipient}`;
    }
  }

  // Inferência de Essencialidade (50% Fixas vs 30% Estilo de Vida)
  const essentialKeywords = [
    'shoprite', 'spar', 'vip', 'premier', 'recheio', 'jumbo', 'credelec',
    'edm', 'fipag', 'galp', 'total', 'petromoc', 'farmacia', 'hospital', 'mercado', 'energia'
  ];
  const lifestyleKeywords = [
    'kfc', 'debonairs', 'pizza', 'restaurante', 'bar', 'hotel', 'mugg',
    'ocean', 'cinema', 'game', 'zara', 'shopping', 'uber', 'jogos', 'lazer'
  ];

  const targetLower = (storeOrRecipient + ' ' + description).toLowerCase();
  if (essentialKeywords.some((k) => targetLower.includes(k))) {
    isEssential = true;
    category = 'essential';
  } else if (lifestyleKeywords.some((k) => targetLower.includes(k))) {
    isEssential = false;
    category = 'lifestyle';
  }

  const dateStr = new Date().toISOString();
  const refMatch = clean.match(/\b([A-Z0-9]{8,15})\b/);
  const referenceId = refMatch ? refMatch[1] : undefined;

  return {
    institution,
    type,
    amount: Math.round(amount * 100) / 100,
    currency: 'MT',
    storeOrRecipient,
    description,
    category,
    isEssential,
    date: dateStr,
    referenceId,
    rawMessage: clean,
  };
}

/**
 * Exemplos reais de Moçambique:
 * - Millennium BIM (+842424 / MBIM / IZI)
 * - M-Pesa (M-Pesa / 8484)
 * - eMola (8686 / Movitel)
 * - Access Bank (AccessBank)
 */
export const SAMPLE_MOZAMBICAN_MESSAGES = [
  {
    institution: 'Millennium BIM',
    label: '+842424 (BIM): Crédito Salário (Janela 25-5)',
    text: 'BIM: Credito de 45,000.00MT na conta *1234 ref PAGAMENTO DE SALARIO EMPRESA LDA em 28/09. Saldo disponivel: 47,800.00MT.',
  },
  {
    institution: 'M-Pesa',
    label: 'M-Pesa (8484): Salário Recebido (Janela 25-5)',
    text: 'PP260928.0930.A11223 Confirmado. Recebeste 35,000.00MT de 841234567 - EMPRESA SERVICOS LDA em 28/09/2026 as 09:30. Saldo actual: 35,850.00MT.',
  },
  {
    institution: 'Millennium BIM',
    label: '+842424 (BIM): Compra POS Galp',
    text: 'BIM: Compra no POS de 3,000.00MT no estabelecimento GALP MOZAMBIQUE em 02/09 08:30 cartao *4910. Saldo disponivel: 28,450.00MT.',
  },
  {
    institution: 'Millennium BIM',
    label: '+842424 (IZI): Débito POS Shoprite',
    text: 'IZI: Debito de 2,450.00MT na conta *1234 ref compra no POS de SHOPRITE MAPUTO. Saldo: 15,120.00MT.',
  },
  {
    institution: 'M-Pesa',
    label: 'M-Pesa (8484): Pagamento Credelec EDM',
    text: 'PP260902.1540.B44556 Confirmado. Pagamento de 1,250.00MT para CREDELEC EDM efectuado com sucesso em 02/09/2026. Recibo: 8847-2910-4491.',
  },
  {
    institution: 'M-Pesa',
    label: 'M-Pesa (8484): Pagamento Restaurante',
    text: 'PP260902.1012.A89123 Confirmado. Pagaste 850.00MT a 900100 - RESTAURANTE SABOR em 02/09/2026 as 14:30. Saldo: 4,120.00MT.',
  },
  {
    institution: 'e-Mola',
    label: 'eMola (8686): Compra VIP Spar',
    text: 'Transaccao 4829104 com sucesso. Pagamento de 1,890.00MT para VIP SPAR efectuado no dia 02/09/2026 18:45. Saldo actual: 3,200.00MT.',
  },
  {
    institution: 'Access Bank',
    label: 'AccessBank: Compra POS KFC Lazer',
    text: 'AccessBank Alert: Debito de 1,650.00MT ref Compra POS - KFC MAPUTO no cartao *7721 em 02-09-2026 19:40. Saldo: 14,200.00MT.',
  },
];
