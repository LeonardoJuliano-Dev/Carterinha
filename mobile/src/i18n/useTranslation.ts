import { useFinanceStore } from '../stores/financeStore';
import { getLanguageCode, translations, Translations } from './translations';

export function useTranslation(): {
  t: Translations;
  language: 'pt' | 'en';
  currencySymbol: string;
} {
  const languageStr = useFinanceStore((state) => state.userProfile?.language);
  const currency = useFinanceStore((state) => state.userProfile?.currency || 'MT');
  const langCode = getLanguageCode(languageStr);
  return {
    t: translations[langCode],
    language: langCode,
    currencySymbol: currency,
  };
}
