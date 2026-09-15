import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { formatMonthDisplay } from '../utils/dateUtils';
import { formatCurrency, formatPercentage, getCurrencySymbol } from '../utils/formatters';
import { useTranslation } from '../i18n/useTranslation';

interface ReportsScreenProps {
  onBack?: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onBack }) => {
  const { weeklySpending, monthlySpending, theme, userProfile, currentMonthYear, selectMonthYear } = useFinanceStore();
  const { t, language } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);

  const [period, setPeriod] = useState<'weekly' | 'yearly'>('weekly');
  const [selectedWeek, setSelectedWeek] = useState<number>(3);
  const [displayMonthYear, setDisplayMonthYear] = useState(currentMonthYear);

  const navigateMonth = useCallback(async (direction: -1 | 1) => {
    const [year, month] = displayMonthYear.split('-').map(Number);
    const d = new Date(year, month - 1 + direction, 1);
    const newKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setDisplayMonthYear(newKey);
    await selectMonthYear(newKey);
  }, [displayMonthYear, selectMonthYear]);

  const currentMonthDisplay = formatMonthDisplay(displayMonthYear, language);

  // Escala dinâmica do eixo Y
  const maxWeekly = Math.max(1, ...weeklySpending.map((w) => w.amount));
  const maxScale = Math.max(500, Math.ceil(maxWeekly / 500) * 500);
  const scaleSteps = [
    maxScale,
    Math.round((maxScale * 2) / 3),
    Math.round(maxScale / 3),
    0,
  ];

  const weeksData = weeklySpending.map((w) => ({
    weekNumber: w.weekNumber,
    label: w.weekLabel,
    amount: w.amount,
    essentialAmount: w.essentialAmount,
    lifestyleAmount: w.lifestyleAmount,
    heightPct: Math.min(100, Math.max(8, (w.amount / maxScale) * 100)),
    essentialPct: w.amount > 0 ? (w.essentialAmount / w.amount) * 100 : 0,
    lifestylePct: w.amount > 0 ? (w.lifestyleAmount / w.amount) * 100 : 0,
    active: w.weekNumber === selectedWeek,
    dates: `${t.week} ${w.weekNumber}`,
  }));

  const handleShareReport = async () => {
    const totalSpentMonth = weeklySpending.reduce((acc, w) => acc + w.amount, 0);
    const essentialTotal = weeklySpending.reduce((acc, w) => acc + w.essentialAmount, 0);
    const lifestyleTotal = weeklySpending.reduce((acc, w) => acc + w.lifestyleAmount, 0);

    const message = `${t.reportShareHeader}
${t.reportShareMonth}: ${currentMonthDisplay}
---------------------------------
• ${t.reportShareTotalSpent}: ${formatCurrency(totalSpentMonth, currencySymbol)}
• ${t.reportShareEssentials}: ${formatCurrency(essentialTotal, currencySymbol)} (${totalSpentMonth > 0 ? ((essentialTotal / totalSpentMonth) * 100).toFixed(0) : 0}%)
• ${t.reportShareLifestyle}: ${formatCurrency(lifestyleTotal, currencySymbol)} (${totalSpentMonth > 0 ? ((lifestyleTotal / totalSpentMonth) * 100).toFixed(0) : 0}%)
---------------------------------
${t.reportShareFooter}`;

    try {
      await Share.share({ message });
    } catch (err) {
      console.error('Erro ao partilhar:', err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar One UI 8.5 (Mockup Screen 8) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao ecrã anterior"
          style={[
            styles.backBtn,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
          {t.reportsTitle}
        </Text>
        <TouchableOpacity
          style={[
            styles.shareBtn,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
          onPress={handleShareReport}
          accessibilityRole="button"
          accessibilityLabel="Partilhar relatório financeiro"
        >
          <Ionicons name="share-outline" size={16} color={colors.primaryCyan} style={{ marginRight: 4 }} />
          <Text style={[styles.shareBtnText, { color: colors.primaryCyan }]}>{t.share}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navegador de Mês Dinâmico */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity
            style={styles.navArrow}
            onPress={() => navigateMonth(-1)}
            accessibilityRole="button"
            accessibilityLabel="Mês anterior"
          >
            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.monthNavTitle, { color: colors.textPrimary }]}>
            {currentMonthDisplay}
          </Text>
          <TouchableOpacity
            style={styles.navArrow}
            onPress={() => navigateMonth(1)}
            accessibilityRole="button"
            accessibilityLabel="Mês seguinte"
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Alternador Semanal vs Anual */}
        <View
          style={[
            styles.segmentedControl,
            {
              backgroundColor: colors.glassSurfaceElevated,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              period === 'weekly' && { backgroundColor: colors.primaryCyan },
            ]}
            onPress={() => setPeriod('weekly')}
            accessibilityRole="button"
            accessibilityLabel="Visualização semanal"
          >
            <Text
              style={[
                styles.segmentText,
                { color: period === 'weekly' ? '#FFFFFF' : colors.textSecondary },
                period === 'weekly' && styles.segmentTextActive,
              ]}
            >
              {t.tabWeekly}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              period === 'yearly' && { backgroundColor: colors.primaryCyan },
            ]}
            onPress={() => setPeriod('yearly')}
            accessibilityRole="button"
            accessibilityLabel="Visualização anual"
          >
            <Text
              style={[
                styles.segmentText,
                { color: period === 'yearly' ? '#FFFFFF' : colors.textSecondary },
                period === 'yearly' && styles.segmentTextActive,
              ]}
            >
              {t.tabYearly}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subtítulo do Gráfico */}
        <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
          {`${t.spendingPerWeek} (${currencySymbol})`}
        </Text>

        {/* Gráfico Principal com Eixo Y Dinâmico e Barras Segmentadas */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          {/* Eixo Y Dinâmico */}
          <View style={styles.yAxis}>
            {scaleSteps.map((val, idx) => (
              <Text key={idx} style={[styles.axisText, { color: colors.textMuted }]}>
                {val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : String(val)}
              </Text>
            ))}
          </View>

          {/* Área de Barras */}
          <View style={styles.barsArea}>
            {weeksData.map((w) => {
              const isSelected = selectedWeek === w.weekNumber;
              return (
                <TouchableOpacity
                  key={w.weekNumber}
                  style={styles.barCol}
                  onPress={() => setSelectedWeek(w.weekNumber)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.week} ${w.weekNumber}, ${formatCurrency(w.amount)}`}
                >
                  {/* Tooltip Detalhado com Parcela Essencial e Lazer */}
                  {isSelected && (
                    <View style={styles.tooltipContainer}>
                      <View style={[styles.tooltipBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.primaryCyan }]}>
                        <Text style={[styles.tooltipTitle, { color: colors.textSecondary }]}>
                          {t.week} {w.weekNumber}
                        </Text>
                        <Text style={[styles.tooltipAmount, { color: colors.textPrimary }]}>
                          {formatCurrency(w.amount, currencySymbol)}
                        </Text>
                        <View style={{ marginTop: 4, gap: 2 }}>
                          <Text style={{ fontSize: 10, color: colors.primaryCyan, fontWeight: '700' }}>
                            {t.essentialNeeds}: {formatCurrency(w.essentialAmount, currencySymbol)}
                          </Text>
                          <Text style={{ fontSize: 10, color: colors.accentPurple, fontWeight: '700' }}>
                            {t.lifestyleWants}: {formatCurrency(w.lifestyleAmount, currencySymbol)}
                          </Text>
                        </View>
                        {w.dates && (
                          <Text style={[styles.tooltipDates, { color: colors.textMuted }]}>
                            {w.dates}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.tooltipPointer, { borderTopColor: colors.primaryCyan }]} />
                    </View>
                  )}

                  {/* Barra com Segmentação Visual */}
                  <View style={[styles.barTrack, { backgroundColor: colors.statTrackBg }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${w.heightPct}%`,
                          overflow: 'hidden',
                          borderRadius: 8,
                        },
                      ]}
                    >
                      {/* Segmento Lazer */}
                      {w.lifestylePct > 0 && (
                        <View
                          style={{
                            height: `${w.lifestylePct}%`,
                            backgroundColor: colors.accentPurple,
                            opacity: isSelected ? 1 : 0.75,
                          }}
                        />
                      )}
                      {/* Segmento Fixas / Essenciais */}
                      <View
                        style={{
                          height: `${Math.max(10, w.essentialPct)}%`,
                          backgroundColor: isSelected ? colors.primaryCyan : '#38BDF8',
                          opacity: isSelected ? 1 : 0.75,
                        }}
                      />
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.barLabel,
                      { color: isSelected ? colors.primaryCyan : colors.textSecondary },
                      isSelected && styles.barLabelActive,
                    ]}
                  >
                    {w.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Legenda (Mockup Screen 8) */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primaryCyan }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t.essentialNeeds} (50%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accentPurple }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t.lifestyleWants} (30%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accentGreen }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t.savingsGoals} (20%)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 160,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
  },
  navArrow: {
    padding: 6,
  },
  monthNavTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 13,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    fontWeight: '800',
  },
  chartSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  chartCard: {
    flexDirection: 'row',
    borderRadius: 28,
    padding: 20,
    paddingTop: 50,
    borderWidth: 1,
    height: 280,
    marginBottom: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingBottom: 24,
    paddingRight: 10,
  },
  axisText: {
    fontSize: 10,
    fontWeight: '600',
  },
  barsArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  barCol: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    width: 50,
  },
  tooltipContainer: {
    position: 'absolute',
    top: -45,
    alignItems: 'center',
    zIndex: 10,
  },
  tooltipBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tooltipTitle: {
    fontSize: 10,
    fontWeight: '700',
  },
  tooltipAmount: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },
  tooltipDates: {
    fontSize: 9,
  },
  tooltipPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  barTrack: {
    width: 24,
    height: 160,
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 12,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  barLabelActive: {
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
