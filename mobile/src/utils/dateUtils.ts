/**
 * Utilitários de manipulação e formatação de datas para a aplicação Carterinhas.
 */

/**
 * Converte 'YYYY-MM' em nome do mês legível por extenso (ex: 'Setembro 2026' ou 'September 2026').
 */
export function formatMonthDisplay(monthYearStr: string, language: 'pt' | 'en' = 'pt'): string {
  try {
    const [year, month] = monthYearStr.split('-');
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const locale = language === 'en' ? 'en-US' : 'pt-PT';
    const rawName = d.toLocaleDateString(locale, { month: 'long' });
    return `${rawName.charAt(0).toUpperCase() + rawName.slice(1)} ${d.getFullYear()}`;
  } catch {
    return monthYearStr;
  }
}

/**
 * Formata uma data ISO ou string para exibição curta (ex: '12/09/2026').
 */
export function formatDateShort(dateStr?: string | null, language: 'pt' | 'en' = 'pt'): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const locale = language === 'en' ? 'en-US' : 'pt-PT';
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Formata data para formato humanizado (ex: '15 de set, 2026' ou 'Sep 15, 2026').
 */
export function formatDateHuman(dateStr?: string | null, language: 'pt' | 'en' = 'pt'): string {
  if (!dateStr) return language === 'en' ? 'No date' : 'Sem data';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const locale = language === 'en' ? 'en-US' : 'pt-PT';
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Avalia o prazo de uma meta e retorna se expirou e quantos dias restam.
 */
export function getDeadlineStatus(
  deadlineStr?: string | null,
  language: 'pt' | 'en' = 'pt'
): {
  hasDeadline: boolean;
  isExpired: boolean;
  daysRemaining: number;
  label: string;
} {
  const isEn = language === 'en';

  if (!deadlineStr) {
    return {
      hasDeadline: false,
      isExpired: false,
      daysRemaining: 0,
      label: isEn ? 'No fixed deadline' : 'Sem prazo fixo',
    };
  }

  try {
    const target = new Date(deadlineStr);
    if (isNaN(target.getTime())) {
      return { hasDeadline: true, isExpired: false, daysRemaining: 0, label: deadlineStr };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const days = Math.abs(diffDays);
      return {
        hasDeadline: true,
        isExpired: true,
        daysRemaining: days,
        label: isEn ? `Expired ${days} day(s) ago` : `Expirou há ${days} dia(s)`,
      };
    } else if (diffDays === 0) {
      return {
        hasDeadline: true,
        isExpired: false,
        daysRemaining: 0,
        label: isEn ? 'Ends today' : 'Termina hoje',
      };
    } else {
      return {
        hasDeadline: true,
        isExpired: false,
        daysRemaining: diffDays,
        label: isEn ? `${diffDays} day(s) remaining` : `${diffDays} dia(s) restante(s)`,
      };
    }
  } catch {
    return { hasDeadline: true, isExpired: false, daysRemaining: 0, label: deadlineStr };
  }
}
