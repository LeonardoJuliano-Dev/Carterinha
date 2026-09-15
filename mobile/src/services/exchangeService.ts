import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedCurrencyCode = 'MZN' | 'USD' | 'EUR' | 'BRL';

export interface ExchangeRates {
  MZN: number;
  USD: number;
  EUR: number;
  BRL: number;
  [key: string]: number;
}

export interface ExchangeRateCache {
  rates: ExchangeRates;
  updatedAt: string;
}

export const EXCHANGE_CACHE_KEY = 'carterinha-exchange-rates';

// Taxas de câmbio de reserva realistas caso o dispositivo esteja offline (base: 1 MZN)
// 1 USD ~ 64 MZN -> 1 MZN = 0.015625 USD
// 1 EUR ~ 70 MZN -> 1 MZN = 0.014285 EUR
// 1 BRL ~ 11.5 MZN -> 1 MZN = 0.086956 BRL
export const FALLBACK_RATES_MZN: ExchangeRates = {
  MZN: 1.0,
  USD: 0.015625,
  EUR: 0.014285,
  BRL: 0.086956,
};

/**
 * Converte string do utilizador (ex: 'Metical (MT)', 'Dólar ($)', 'USD') para o código ISO oficial.
 */
export function getCurrencyCode(currencyString?: string): SupportedCurrencyCode {
  if (!currencyString) return 'MZN';
  const upper = currencyString.toUpperCase();
  if (
    upper.includes('USD') ||
    upper.includes('DÓLAR') ||
    upper.includes('DOLAR') ||
    (upper.includes('$') && !upper.includes('R$'))
  ) {
    return 'USD';
  }
  if (upper.includes('EUR') || upper.includes('EURO') || upper.includes('€')) {
    return 'EUR';
  }
  if (upper.includes('BRL') || upper.includes('REAL') || upper.includes('R$')) {
    return 'BRL';
  }
  return 'MZN';
}

/**
 * Procura taxas de câmbio atualizadas da API com suporte a cache local e fallback offline.
 */
export async function getLiveExchangeRates(): Promise<{ rates: ExchangeRates; updatedAt: string }> {
  // 1. Verificar cache local
  try {
    const cached = await AsyncStorage.getItem(EXCHANGE_CACHE_KEY);
    if (cached) {
      const parsed: ExchangeRateCache = JSON.parse(cached);
      const cacheDate = parsed.updatedAt.split('/').reverse().join('-');
      const today = new Date().toISOString().slice(0, 10);
      if (cacheDate === today && parsed.rates?.USD) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[ExchangeService] Erro ao ler cache de câmbio:', e);
  }

  // 2. Tentar buscar em tempo real
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch('https://open.er-api.com/v6/latest/MZN', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        const rates: ExchangeRates = {
          MZN: 1,
          USD: data.rates.USD || FALLBACK_RATES_MZN.USD,
          EUR: data.rates.EUR || FALLBACK_RATES_MZN.EUR,
          BRL: data.rates.BRL || FALLBACK_RATES_MZN.BRL,
        };
        const now = new Date();
        const updatedStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

        await AsyncStorage.setItem(
          EXCHANGE_CACHE_KEY,
          JSON.stringify({ rates, updatedAt: updatedStr })
        );

        return { rates, updatedAt: updatedStr };
      }
    }
  } catch (err) {
    console.warn('[ExchangeService] Rede indisponível ou timeout na API de câmbio:', err);
  }

  // 3. Fallback se estiver offline e sem cache
  const now = new Date();
  const fallbackDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  return { rates: FALLBACK_RATES_MZN, updatedAt: fallbackDate };
}

/**
 * Calcula o rácio de conversão entre a moeda antiga e a nova moeda.
 * Se 1 MZN = 0.015625 USD, para converter de MZN para USD: ratio = 0.015625.
 * Para converter de USD para MZN: ratio = 1 / 0.015625 = 64.
 */
export function calculateExchangeRatio(
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): { ratio: number; fromCode: SupportedCurrencyCode; toCode: SupportedCurrencyCode } {
  const fromCode = getCurrencyCode(fromCurrency);
  const toCode = getCurrencyCode(toCurrency);

  if (fromCode === toCode) {
    return { ratio: 1.0, fromCode, toCode };
  }

  const fromRateAgainstMzn = rates[fromCode] || FALLBACK_RATES_MZN[fromCode] || 1;
  const toRateAgainstMzn = rates[toCode] || FALLBACK_RATES_MZN[toCode] || 1;

  // Valor em MZN = valorOriginal / fromRateAgainstMzn
  // Valor em Nova Moeda = Valor em MZN * toRateAgainstMzn
  // Ratio = toRateAgainstMzn / fromRateAgainstMzn
  const ratio = toRateAgainstMzn / fromRateAgainstMzn;

  return { ratio, fromCode, toCode };
}
