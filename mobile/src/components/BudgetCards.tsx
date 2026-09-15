import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Budget } from '../types';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import { useTranslation } from '../i18n/useTranslation';

interface BudgetCardsProps {
  budgets: Budget[];
  totalIncome?: number;
}

export const BudgetCards: React.FC<BudgetCardsProps> = ({ budgets, totalIncome }) => {
  const { theme, userProfile } = useFinanceStore();
  const { t } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);

  const getCardDetails = (category: string) => {
    switch (category) {
      case 'essential':
        return {
          title: t.essentialNeeds,
          subtitle: t.essentialNeedsSub,
          accentColor: colors.primaryCyan,
          trackColor: colors.primaryCyanLight,
        };
      case 'lifestyle':
        return {
          title: t.lifestyleWants,
          subtitle: t.lifestyleWantsSub,
          accentColor: colors.accentPurple,
          trackColor: 'rgba(147, 51, 234, 0.12)',
        };
      case 'savings_goals':
      default:
        return {
          title: t.savingsGoals,
          subtitle: t.savingsGoalsSub,
          accentColor: colors.accentGreen,
          trackColor: 'rgba(5, 150, 105, 0.12)',
        };
    }
  };

  if (!budgets || budgets.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {
            backgroundColor: colors.glassSurface,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          {t.noSalaryRegisteredThisMonth}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {t.registerIncomeFor503020}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.monthlyAllocationHeader}
      </Text>
      {budgets.map((budget) => {
        const details = getCardDetails(budget.category);
        const spent = budget.spent_amount || 0;
        const allocated = budget.allocated_amount || 0;
        const remaining = Math.max(0, allocated - spent);
        const progress = allocated > 0 ? Math.min(1, spent / allocated) : 0;
        const progressPercentage = (progress * 100).toFixed(0);

        return (
          <View
            key={budget.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
                shadowColor: details.accentColor,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {details.title}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  {details.subtitle}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: details.trackColor }]}>
                <Text style={[styles.pillText, { color: details.accentColor }]}>
                  {progressPercentage}% {t.spentLabel}
                </Text>
              </View>
            </View>

            <View style={styles.amountRow}>
              <View>
                <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
                  {t.availableLabel}
                </Text>
                <Text style={[styles.amountValue, { color: details.accentColor }]}>
                  {formatCurrency(remaining, currencySymbol)}
                </Text>
              </View>
              <View style={styles.amountRight}>
                <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
                  {t.monthlyCeilingLabel}
                </Text>
                <Text style={[styles.amountTotal, { color: colors.textSecondary }]}>
                  {formatCurrency(allocated, currencySymbol)}
                </Text>
              </View>
            </View>

            {/* Barra de Progresso One UI 8.5 em Cristal */}
            <View
              style={[
                styles.progressBarBackground,
                { backgroundColor: colors.statTrackBg },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.max(4, progress * 100)}%`,
                    backgroundColor: details.accentColor,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    borderRadius: 28,
    padding: 22,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    borderRadius: 26,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  amountRight: {
    alignItems: 'flex-end',
  },
  amountTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
