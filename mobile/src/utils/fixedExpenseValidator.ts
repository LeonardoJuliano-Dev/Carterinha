import { FixedExpense } from '../types';

export interface FixedValidationResult {
  isValidFixed: boolean;
  isRegistered: boolean;
  isDiscretionary: boolean;
  matchedFixedName?: string;
  reason?: string;
}

// Lista de palavras e termos claramente associados a lazer / consumo supérfluo
const DISCRETIONARY_KEYWORDS = [
  'bar',
  'cerveja',
  'cervejas',
  'chope',
  'vinho',
  'whisky',
  'vodka',
  'gin',
  'bebida',
  'bebidas',
  'copo',
  'copos',
  'restaurante',
  'jantar fora',
  'almoco fora',
  'almoço fora',
  'sushi',
  'pizza',
  'hamburguer',
  'hambúrguer',
  'lanchonete',
  'snack',
  'gelado',
  'sorvete',
  'doce',
  'sobremesa',
  'festa',
  'balada',
  'discoteca',
  'night club',
  'cinema',
  'filme',
  'netflix',
  'spotify',
  'show',
  'concerto',
  'bilhete',
  'ingresso',
  'jogo',
  'jogos',
  'playstation',
  'ps5',
  'steam',
  'roupa',
  'roupas',
  'vestido',
  'camisa',
  'calcado',
  'calçado',
  'tenis',
  'ténis',
  'sapatos',
  'bolsa',
  'shopping',
  'viagem',
  'hotel',
  'resort',
  'passeio',
  'praia',
  'spa',
  'massagem',
  'brinco',
  'joia',
  'relogio',
  'relógio',
  'tabaco',
  'cigarro',
  'vape',
];

// Lista de termos reconhecidos como genuinamente essenciais em Moçambique
const ESSENTIAL_KEYWORDS = [
  'renda',
  'aluguer',
  'casa',
  'condominio',
  'condomínio',
  'credelec',
  'edm',
  'energia',
  'eletricidade',
  'electricidade',
  'luz',
  'agua',
  'água',
  'fipag',
  'gas',
  'gás',
  'botija',
  'internet',
  'tvcabo',
  'fibra',
  'telecom',
  'movitel',
  'vodacom',
  'tmcel',
  'mcel',
  'escola',
  'colegio',
  'colégio',
  'propina',
  'propinas',
  'faculdade',
  'universidade',
  'material escolar',
  'saude',
  'saúde',
  'farmacia',
  'farmácia',
  'medicamento',
  'medicamentos',
  'remedio',
  'remédio',
  'medico',
  'médico',
  'hospital',
  'clinica',
  'clínica',
  'consulta',
  'exame',
  'dentista',
  'combustivel',
  'combustível',
  'gasolina',
  'gasoleo',
  'gasóleo',
  'chapa',
  'transporte',
  'passe',
  'rancho',
  'compras do mes',
  'compras do mês',
  'supermercado',
  'arroz',
  'farinha',
  'oleo',
  'óleo',
  'pao',
  'pão',
  'leite',
  'alimentacao',
  'alimentação',
];

/**
 * Normaliza strings para facilitar comparação sem acentos e em minúsculas
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Valida se uma despesa inserida para a categoria 'Fixas / Essenciais (50%)'
 * corresponde de facto a uma conta fixa registada pelo utilizador ou a um gasto essencial.
 */
export function validateFixedExpense(
  description: string,
  userFixedExpenses: FixedExpense[]
): FixedValidationResult {
  const normDesc = normalizeText(description);

  if (!normDesc) {
    return {
      isValidFixed: false,
      isRegistered: false,
      isDiscretionary: false,
      reason: 'Descrição da despesa vazia.',
    };
  }

  // 1. Verificar correspondência com as Contas Fixas cadastradas pelo utilizador
  for (const fe of userFixedExpenses) {
    const normFeName = normalizeText(fe.name);
    if (
      normDesc === normFeName ||
      normDesc.includes(normFeName) ||
      normFeName.includes(normDesc)
    ) {
      return {
        isValidFixed: true,
        isRegistered: true,
        isDiscretionary: false,
        matchedFixedName: fe.name,
      };
    }
  }

  // 2. Verificar se contém palavras claras de lazer/supérfluos
  const words = normDesc.split(/[\s,.-]+/);
  const isDiscretionary = DISCRETIONARY_KEYWORDS.some((kw) =>
    words.includes(kw) || normDesc.includes(kw)
  );

  if (isDiscretionary) {
    const registeredNames = userFixedExpenses.map((f) => f.name).join(', ');
    return {
      isValidFixed: false,
      isRegistered: false,
      isDiscretionary: true,
      reason: `"${description}" aparenta ser uma despesa de Lazer / Estilo de Vida e não consta das tuas contas fixas cadastradas (${registeredNames || 'nenhuma'}).`,
    };
  }

  // 3. Verificar se é um termo essencial conhecido
  const isLikelyEssential = ESSENTIAL_KEYWORDS.some((kw) =>
    words.includes(kw) || normDesc.includes(kw)
  );

  if (isLikelyEssential) {
    return {
      isValidFixed: true,
      isRegistered: false,
      isDiscretionary: false,
    };
  }

  // 4. Não é uma despesa fixa registada nem um termo essencial reconhecido
  const registeredNames = userFixedExpenses.map((f) => f.name).join(', ');
  return {
    isValidFixed: false,
    isRegistered: false,
    isDiscretionary: false,
    reason: `"${description}" não coincide com as tuas contas fixas registadas (${registeredNames || 'nenhuma'}) nem parece ser uma despesa essencial imediata.`,
  };
}
