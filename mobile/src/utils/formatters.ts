/**
 * Utilitários de formatação de valores monetários e percentuais.
 */

/**
 * Formata um valor numérico para a moeda selecionada (ex: '1.500,00 MT' ou '1.500 $').
 */
export function formatCurrency(
  amount: number,
  currency = 'MT',
  showDecimals = false
): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  const formatted = safeAmount.toLocaleString('pt-PT', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
  return `${formatted} ${currency}`;
}

/**
 * Extrai o símbolo representativo da moeda escolhida pelo utilizador.
 */
export function getCurrencySymbol(currencyStr?: string): string {
  if (!currencyStr) return 'MT';
  if (currencyStr.includes('Dólar') || currencyStr.includes('$') || currencyStr.includes('USD')) return '$';
  if (currencyStr.includes('Euro') || currencyStr.includes('€') || currencyStr.includes('EUR')) return '€';
  if (currencyStr.includes('Real') || currencyStr.includes('R$') || currencyStr.includes('BRL')) return 'R$';
  return 'MT';
}

/**
 * Formata uma percentagem (ex: '50%').
 */
export function formatPercentage(value: number, decimals = 0): string {
  const safeValue = isNaN(value) ? 0 : value;
  return `${safeValue.toFixed(decimals)}%`;
}
