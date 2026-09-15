export interface ThemeGradients {
  cyan: [string, string, ...string[]];
  purple: [string, string, ...string[]];
  green: [string, string, ...string[]];
  amber: [string, string, ...string[]];
  red: [string, string, ...string[]];
  hero: [string, string, ...string[]];
  glassSheen: [string, string];
}

export interface ThemeColors {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceElevated: string;
  inputBg: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primaryCyan: string;
  primaryCyanLight: string;
  accentBlue: string;
  accentPurple: string;
  accentGreen: string;
  accentAmber: string;
  accentRed: string;
  floatingNavBg: string;
  floatingNavBorder: string;
  activeNavBg: string;
  cardShadow: string;
  statTrackBg: string;

  // Tokens de Cristal & Glassmorphism
  glassSurface: string;
  glassSurfaceElevated: string;
  glassBorder: string;
  glassBorderTop: string;
  glassBorderSubtle: string;
  glassInputBg: string;
  crystalGlow: string;
  gradients: ThemeGradients;
}

export const lightTheme: ThemeColors = {
  isDark: false,
  background: '#F1F5F9', // Gelo cristalino suave e límpido
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  inputBg: '#F8FAFC',
  border: 'rgba(15, 23, 42, 0.08)',
  borderSubtle: 'rgba(15, 23, 42, 0.04)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primaryCyan: '#0284C7',
  primaryCyanLight: 'rgba(2, 132, 199, 0.10)',
  accentBlue: '#2563EB',
  accentPurple: '#9333EA',
  accentGreen: '#059669',
  accentAmber: '#D97706',
  accentRed: '#E11D48',
  floatingNavBg: '#FFFFFF', // 100% opaco: elimina transparência excessiva ao fazer scroll
  floatingNavBorder: 'rgba(2, 132, 199, 0.22)',
  activeNavBg: 'rgba(2, 132, 199, 0.12)',
  cardShadow: 'rgba(2, 132, 199, 0.12)',
  statTrackBg: '#E2E8F0',

  // Cristal Claro: Superfície branca pura e límpida com contorno de cristal ciano e arestas uniformes
  glassSurface: '#FFFFFF',
  glassSurfaceElevated: '#FFFFFF',
  glassBorder: 'rgba(2, 132, 199, 0.16)', // contorno de cristal límpido e suave sem costuras
  glassBorderTop: 'rgba(2, 132, 199, 0.16)',
  glassBorderSubtle: 'rgba(15, 23, 42, 0.06)',
  glassInputBg: '#F8FAFC',
  crystalGlow: 'rgba(2, 132, 199, 0.18)',
  gradients: {
    cyan: ['#00E5FF', '#0284C7', '#1D4ED8'],
    purple: ['#E879F9', '#9333EA', '#4F46E5'],
    green: ['#34D399', '#059669', '#064E3B'],
    amber: ['#FDE047', '#F59E0B', '#B45309'],
    red: ['#FB7185', '#E11D48', '#881337'],
    hero: ['#00E5FF', '#0284C7', '#1E40AF'],
    glassSheen: ['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.0)'],
  },
};

export const darkTheme: ThemeColors = {
  isDark: true,
  background: '#0B1120', // Obsidiana cristalina profunda com nuances safira
  surface: '#111C33',
  surfaceElevated: '#182744',
  inputBg: '#0D1527',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primaryCyan: '#38BDF8',
  primaryCyanLight: 'rgba(56, 189, 248, 0.15)',
  accentBlue: '#3B82F6',
  accentPurple: '#A855F7',
  accentGreen: '#10B981',
  accentAmber: '#F59E0B',
  accentRed: '#F43F5E',
  floatingNavBg: '#0F172A', // 100% opaco: elimina transparência excessiva ao fazer scroll
  floatingNavBorder: 'rgba(56, 189, 248, 0.28)',
  activeNavBg: 'rgba(56, 189, 248, 0.18)',
  cardShadow: '#000000',
  statTrackBg: 'rgba(255, 255, 255, 0.08)',

  // Cristal Escuro: Safira noturno profundo com aresta luminosa de diamante neon
  glassSurface: '#111C33', // Safira límpido e rico (sem efeito de retângulo lamacento)
  glassSurfaceElevated: '#182744',
  glassBorder: 'rgba(56, 189, 248, 0.22)', // aresta de cristal neon radiante uniforme
  glassBorderTop: 'rgba(56, 189, 248, 0.22)',
  glassBorderSubtle: 'rgba(255, 255, 255, 0.08)',
  glassInputBg: '#0D1527',
  crystalGlow: 'rgba(56, 189, 248, 0.25)',
  gradients: {
    cyan: ['#38BDF8', '#0284C7', '#0F172A'],
    purple: ['#C084FC', '#9333EA', '#1E1B4B'],
    green: ['#34D399', '#10B981', '#064E3B'],
    amber: ['#FCD34D', '#F59E0B', '#78350F'],
    red: ['#FB7185', '#F43F5E', '#881337'],
    hero: ['#38BDF8', '#0284C7', '#1E293B'],
    glassSheen: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.0)'],
  },
};

/**
 * Retorna o tema (claro ou escuro) ajustado com a cor principal escolhida pelo utilizador.
 */
export function getTheme(theme: 'light' | 'dark', customPrimaryColor?: string): ThemeColors {
  const base = theme === 'light' ? lightTheme : darkTheme;
  if (!customPrimaryColor) {
    return base;
  }

  const hex = customPrimaryColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 2;
  const g = parseInt(hex.substring(2, 4), 16) || 132;
  const b = parseInt(hex.substring(4, 6), 16) || 199;
  const primaryLight = `rgba(${r}, ${g}, ${b}, ${theme === 'light' ? 0.14 : 0.20})`;
  const crystalGlow = `rgba(${r}, ${g}, ${b}, ${theme === 'light' ? 0.25 : 0.35})`;

  // Criação de gradiente hero baseado na cor primária escolhida
  const darkerR = Math.max(0, r - 40);
  const darkerG = Math.max(0, g - 40);
  const darkerB = Math.max(0, b - 40);
  const heroGradient: [string, string, string] = [
    customPrimaryColor,
    `rgb(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)})`,
    `rgb(${darkerR}, ${darkerG}, ${darkerB})`,
  ];

  // Gradiente ciano dinâmico baseado na cor primária escolhida
  const lighterR = Math.min(255, r + 60);
  const lighterG = Math.min(255, g + 60);
  const lighterB = Math.min(255, b + 60);
  const cyanGradient: [string, string, string] = [
    `rgb(${lighterR}, ${lighterG}, ${lighterB})`,
    customPrimaryColor,
    `rgb(${darkerR}, ${darkerG}, ${darkerB})`,
  ];

  return {
    ...base,
    primaryCyan: customPrimaryColor,
    primaryCyanLight: primaryLight,
    activeNavBg: primaryLight,
    floatingNavBorder: `rgba(${r}, ${g}, ${b}, 0.25)`,
    cardShadow: `rgba(${r}, ${g}, ${b}, ${theme === 'light' ? 0.12 : 0.0})`,
    crystalGlow,
    glassBorder: `rgba(${r}, ${g}, ${b}, ${theme === 'light' ? 0.16 : 0.22})`,
    glassBorderTop: `rgba(${r}, ${g}, ${b}, ${theme === 'light' ? 0.16 : 0.22})`,
    gradients: {
      ...base.gradients,
      cyan: cyanGradient,
      hero: heroGradient,
    },
  };
}
