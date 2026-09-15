import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FixedExpense } from '../types';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import { useTranslation } from '../i18n/useTranslation';
import { getFixedExpenseCategoryLabel } from '../i18n/translations';

interface FixedExpensesSectionProps {
  fixedExpenses: FixedExpense[];
  essentialBudgetAllocated: number;
  onAddFixedExpense: (name: string, amount: number, category: string, dueDay: number) => Promise<void>;
  onToggleFixedExpense: (id: string, isActive: boolean) => Promise<void>;
  onRemoveFixedExpense: (id: string) => Promise<void>;
}

const CATEGORY_OPTIONS = [
  { id: 'habitação', labelKey: 'catHousing' as const, icon: 'home-outline' },
  { id: 'serviços', labelKey: 'catUtilities' as const, icon: 'flash-outline' },
  { id: 'telecom', labelKey: 'catTelecom' as const, icon: 'wifi-outline' },
  { id: 'saúde', labelKey: 'catHealth' as const, icon: 'shield-checkmark-outline' },
  { id: 'outros', labelKey: 'catOther' as const, icon: 'receipt-outline' },
];

export function FixedExpensesSection({
  fixedExpenses,
  essentialBudgetAllocated,
  onAddFixedExpense,
  onToggleFixedExpense,
  onRemoveFixedExpense,
}: FixedExpensesSectionProps) {
  const { theme, userProfile } = useFinanceStore();
  const { t } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('habitação');
  const [dueDay, setDueDay] = useState('1');

  const totalFixedActive = fixedExpenses
    .filter((f) => f.is_active)
    .reduce((sum, f) => sum + f.amount, 0);

  const commitmentPercent =
    essentialBudgetAllocated > 0
      ? Math.min(100, (totalFixedActive / essentialBudgetAllocated) * 100)
      : 0;

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(',', '.'));
    const numDay = parseInt(dueDay, 10) || 1;
    if (!name.trim() || isNaN(numAmount) || numAmount <= 0) return;

    await onAddFixedExpense(name.trim(), numAmount, category, numDay);
    setName('');
    setAmount('');
    setDueDay('1');
    setCategory('habitação');
    setModalVisible(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
        },
      ]}
    >
      {/* Cabeçalho da Secção */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t.fixedExpensesEssential}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.predictableMonthlyCommitments}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primaryCyanLight }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.addBtnText, { color: colors.primaryCyan }]}>+ {t.newShort}</Text>
        </TouchableOpacity>
      </View>

      {/* Cartão de Impacto e Previsão One UI 8.5 */}
      <View
        style={[
          styles.summaryContainer,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.summaryTop}>
          <View>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              {t.committedTotal}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.primaryCyan }]}>
              {formatCurrency(totalFixedActive, currencySymbol)}
            </Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              {t.availableForVariables}
            </Text>
            <Text style={[styles.summaryRemainingValue, { color: colors.accentGreen }]}>
              {formatCurrency(Math.max(0, essentialBudgetAllocated - totalFixedActive), currencySymbol)}
            </Text>
          </View>
        </View>

        {/* Barra de Progresso de Comprometimento */}
        <View style={[styles.progressTrack, { backgroundColor: colors.statTrackBg }]}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${commitmentPercent}%`,
                backgroundColor: commitmentPercent > 80 ? colors.accentRed : colors.primaryCyan,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          {commitmentPercent.toFixed(0)}% {t.fixedExpensesCommittedDesc}
        </Text>
      </View>

      {/* Lista de Despesas Fixas */}
      <View style={styles.list}>
        {fixedExpenses.map((expense) => (
          <View
            key={expense.id}
            style={[
              styles.expenseItem,
              {
                borderBottomColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.expenseInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.expenseName, { color: colors.textPrimary }]}>
                  {expense.name}
                </Text>
                {expense.due_day && (
                  <View
                    style={[
                      styles.dueDayBadge,
                      { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.dueDayText, { color: colors.primaryCyan }]}>
                      {t.dueDayBadge} {expense.due_day}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.expenseCategory, { color: colors.textMuted }]}>
                {getFixedExpenseCategoryLabel(expense.category, t)}
              </Text>
            </View>

            <View style={styles.expenseActions}>
              <Text
                style={[
                  styles.expenseAmount,
                  { color: expense.is_active ? colors.textPrimary : colors.textMuted },
                ]}
              >
                {formatCurrency(expense.amount, currencySymbol)}
              </Text>
              <Switch
                value={expense.is_active}
                onValueChange={(val) => onToggleFixedExpense(expense.id, val)}
                trackColor={{ false: '#94A3B8', true: colors.primaryCyan }}
                thumbColor="#FFFFFF"
              />
              <TouchableOpacity
                style={[
                  styles.deleteBtn,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
                onPress={() => onRemoveFixedExpense(expense.id)}
              >
                <Ionicons name="trash-outline" size={14} color={colors.accentRed} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Modal para Adicionar Despesa Fixa */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t.addFixedExpense}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {t.addFixedExpenseSub}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t.placeholderFixedExpenseName}
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t.placeholderFixedExpenseAmount}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t.selectCategory.toUpperCase()}
            </Text>
            <View style={styles.categoryChipsRow}>
              {CATEGORY_OPTIONS.map((catOpt) => {
                const isSelected = category === catOpt.id;
                return (
                  <TouchableOpacity
                    key={catOpt.id}
                    onPress={() => setCategory(catOpt.id)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? colors.primaryCyanLight : colors.surfaceElevated,
                        borderColor: isSelected ? colors.primaryCyan : colors.borderSubtle,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={catOpt.icon as any}
                      size={13}
                      color={isSelected ? colors.primaryCyan : colors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        {
                          color: isSelected ? colors.primaryCyan : colors.textSecondary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {t[catOpt.labelKey]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t.dueDebitDayLabel}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t.placeholderFixedExpenseDay}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={dueDay}
              onChangeText={setDueDay}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                  {t.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primaryCyan }]}
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>{t.saveFixedExpenseBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  summaryContainer: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryRemainingValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  list: {
    gap: 4,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  expenseInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseName: {
    fontSize: 14,
    fontWeight: '700',
  },
  dueDayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  dueDayText: {
    fontSize: 9,
    fontWeight: '800',
  },
  expenseCategory: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  expenseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginBottom: 16,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
