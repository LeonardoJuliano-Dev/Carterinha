import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MonthlySpending, WeeklySpending } from '../types';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { useTranslation } from '../i18n/useTranslation';
import { formatCurrency } from '../utils/formatters';

interface ExpenseChartProps {
  weeklyData: WeeklySpending[];
  monthlyData: MonthlySpending[];
}

export function ExpenseChart({ weeklyData, monthlyData }: ExpenseChartProps) {
  const { t, currencySymbol } = useTranslation();
  const { theme, userProfile } = useFinanceStore();
  const colors = getTheme(theme, userProfile.primaryColor);

  const [period, setPeriod] = useState<'weekly' | 'yearly'>('weekly');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const isWeekly = period === 'weekly';
  const data = isWeekly ? weeklyData : monthlyData;

  const maxVal = Math.max(
    ...data.map((d) => d.amount),
    isWeekly ? 2500 : 15000
  );

  const totalPeriod = data.reduce((acc, d) => acc + d.amount, 0);
  const avgPeriod = data.length > 0 ? totalPeriod / data.length : 0;

  const activeItem = selectedIndex !== null && data[selectedIndex] ? data[selectedIndex] : null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.glassSurface,
          borderColor: colors.glassBorder,
          borderTopColor: colors.glassBorderTop,
          shadowColor: colors.cardShadow,
        },
      ]}
    >
      {/* Cabeçalho do Gráfico & Segmented Control One UI 8.5 */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {t.expenseEvolution}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {isWeekly ? t.weeklyEvolutionDesc : t.yearlyEvolutionDesc}
          </Text>
        </View>

        {/* Alternador de Período estilo One UI 8.5 */}
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
              isWeekly && { backgroundColor: colors.primaryCyan },
            ]}
            onPress={() => {
              setPeriod('weekly');
              setSelectedIndex(null);
            }}
          >
            <Text
              style={[
                styles.segmentText,
                { color: isWeekly ? '#FFFFFF' : colors.textSecondary },
                isWeekly && styles.segmentTextActive,
              ]}
            >
              {t.weeks}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              !isWeekly && { backgroundColor: colors.primaryCyan },
            ]}
            onPress={() => {
              setPeriod('yearly');
              setSelectedIndex(null);
            }}
          >
            <Text
              style={[
                styles.segmentText,
                { color: !isWeekly ? '#FFFFFF' : colors.textSecondary },
                !isWeekly && styles.segmentTextActive,
              ]}
            >
              {t.yearly}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Destaque do Item Selecionado ou Média */}
      <View
        style={[
          styles.statsRow,
          {
            backgroundColor: colors.glassSurfaceElevated,
            borderColor: colors.glassBorder,
            borderTopColor: colors.glassBorderTop,
          },
        ]}
      >
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {activeItem
              ? 'weekLabel' in activeItem
                ? activeItem.weekLabel
                : activeItem.monthLabel
              : t.totalInPeriod}
          </Text>
          <Text style={[styles.statValue, { color: colors.primaryCyan }]}>
            {formatCurrency(activeItem ? activeItem.amount : totalPeriod, currencySymbol)}
          </Text>
        </View>

        <View style={styles.statBoxRight}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t.averagePer} {isWeekly ? t.week : t.month}
          </Text>
          <Text style={[styles.statAvgValue, { color: colors.textPrimary }]}>
            {formatCurrency(avgPeriod, currencySymbol)}
          </Text>
        </View>
      </View>

      {/* Gráfico de Barras com Pontinhos Marcadores One UI 8.5 */}
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const isSelected = selectedIndex === index;
          const barHeightPercent =
            maxVal > 0 ? Math.min(100, Math.max(10, (item.amount / maxVal) * 100)) : 10;
          const label = 'weekLabel' in item ? `${t.weekShort} ${item.weekNumber}` : item.monthLabel;

          return (
            <TouchableOpacity
              key={index}
              style={styles.barColumn}
              activeOpacity={0.7}
              onPress={() => setSelectedIndex(isSelected ? null : index)}
            >
              {/* Tooltip de valor quando selecionado */}
              <View style={styles.barTooltipContainer}>
                {isSelected && (
                  <View style={[styles.barTooltip, { backgroundColor: colors.primaryCyan }]}>
                    <Text style={styles.barTooltipText}>
                      {formatCurrency(item.amount, currencySymbol)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Pontinho Marcador Superior (Weekly Indicator Dot) */}
              <View
                style={[
                  styles.markerDot,
                  {
                    backgroundColor: isSelected
                      ? colors.primaryCyan
                      : item.amount > 0
                      ? colors.primaryCyan
                      : colors.statTrackBg,
                    borderColor: isSelected ? colors.surface : 'transparent',
                    borderWidth: isSelected ? 2 : 0,
                    transform: [{ scale: isSelected ? 1.3 : 1 }],
                  },
                ]}
              />

              {/* Trilho e Barra de Progresso */}
              <View style={[styles.barTrack, { backgroundColor: colors.statTrackBg }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${barHeightPercent}%`,
                      backgroundColor: isSelected ? colors.primaryCyan : colors.primaryCyan,
                      opacity: isSelected ? 1 : 0.8,
                    },
                  ]}
                />
              </View>

              {/* Pontinho inferior da semana */}
              <View
                style={[
                  styles.bottomDot,
                  {
                    backgroundColor: isSelected ? colors.primaryCyan : colors.textMuted,
                  },
                ]}
              />

              {/* Rótulo inferior */}
              <Text
                style={[
                  styles.barLabel,
                  { color: isSelected ? colors.primaryCyan : colors.textSecondary },
                  isSelected && styles.barLabelSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legenda 50/30 */}
      <View style={[styles.legendContainer, { borderTopColor: colors.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primaryCyan }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            {t.essentialNeeds}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accentPurple }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            {t.lifestyleWants}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 13,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  segmentTextActive: {
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  statBox: {},
  statBoxRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 19,
    fontWeight: '900',
    marginTop: 2,
  },
  statAvgValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 145,
    paddingTop: 18,
    paddingBottom: 2,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTooltipContainer: {
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barTooltip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    position: 'absolute',
    bottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  barTooltipText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 75,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  bottomDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  barLabelSelected: {
    fontWeight: '900',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
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
    fontSize: 11,
    fontWeight: '600',
  },
});
