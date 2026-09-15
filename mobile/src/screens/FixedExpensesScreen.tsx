import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { useTranslation } from '../i18n/useTranslation';
import { getFixedExpenseCategoryLabel } from '../i18n/translations';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';

interface FixedExpensesScreenProps {
  onBack?: () => void;
}

const CATEGORY_OPTIONS = [
  { id: 'habitação', labelKey: 'catHousing' as const, icon: 'home-outline' },
  { id: 'serviços', labelKey: 'catUtilities' as const, icon: 'flash-outline' },
  { id: 'telecom', labelKey: 'catTelecom' as const, icon: 'wifi-outline' },
  { id: 'saúde', labelKey: 'catHealth' as const, icon: 'shield-checkmark-outline' },
  { id: 'outros', labelKey: 'catOther' as const, icon: 'receipt-outline' },
];

export const FixedExpensesScreen: React.FC<FixedExpensesScreenProps> = ({ onBack }) => {
  const {
    fixedExpenses,
    budgets,
    transactions,
    addTransaction,
    addFixedExpense,
    toggleFixedExpense,
    removeFixedExpense,
    theme,
    userProfile,
  } = useFinanceStore();

  const { t } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('habitação');
  const [dueDay, setDueDay] = useState('5');

  const essentialBudget = budgets.find((b) => b.category === 'essential');
  const totalAllocated = essentialBudget ? essentialBudget.allocated_amount : 12250.0;

  const totalCommitted = fixedExpenses
    .filter((f) => f.is_active)
    .reduce((sum, f) => sum + f.amount, 0);

  const freeForVariables = Math.max(0, totalAllocated - totalCommitted);
  const committedPercent = totalAllocated > 0 ? Math.min(100, (totalCommitted / totalAllocated) * 100) : 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const isPaidThisMonth = (expenseName: string) => {
    const normE = expenseName.trim().toLowerCase();
    return transactions.some((tr) => {
      const tDate = new Date(tr.created_at);
      if (isNaN(tDate.getTime())) return false;
      if (tDate.getFullYear() !== currentYear || tDate.getMonth() !== currentMonth) return false;
      const normT = (tr.description || '').trim().toLowerCase();
      return (
        (tr.category === 'essential' || tr.is_essential) &&
        (normT.includes(normE) || normE.includes(normT))
      );
    });
  };

  const handlePayFixedExpense = (expense: typeof fixedExpenses[0]) => {
    Alert.alert(
      `${t.payExpense} - ${expense.name}?`,
      `${t.confirmFixedPayDesc} (${formatCurrency(expense.amount, currencySymbol)})`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.confirmPayment,
          onPress: async () => {
            try {
              await addTransaction(
                expense.name,
                expense.amount,
                true,
                'essential',
                undefined,
                expense.category
              );
              Alert.alert(t.confirm, t.fixedPaidSuccess);
            } catch (err) {
              Alert.alert(t.errorTitle, t.errorPayFixedExpense);
            }
          },
        },
      ]
    );
  };

  const handleRemoveExpense = (expense: typeof fixedExpenses[0]) => {
    Alert.alert(
      t.delete,
      t.deleteFixedConfirm,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: () => removeFixedExpense(expense.id),
        },
      ]
    );
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(',', '.'));
    const numDay = parseInt(dueDay, 10) || 1;
    if (!name.trim() || isNaN(numAmount) || numAmount <= 0) return;

    // Prevenir duplicação de contas fixas com o mesmo nome
    const normalizedName = name.trim().toLowerCase();
    const alreadyExists = fixedExpenses.some(
      (fe) => fe.name.trim().toLowerCase() === normalizedName
    );
    if (alreadyExists) {
      Alert.alert(
        t.accountAlreadyExists,
        t.accountAlreadyExistsDesc
      );
      return;
    }

    await addFixedExpense(name.trim(), numAmount, category, numDay);
    setName('');
    setAmount('');
    setDueDay('5');
    setCategory('habitação');
    setModalVisible(false);
  };

  const getCategoryIcon = (cat: string) => {
    const norm = (cat || '').toLowerCase();
    if (norm.includes('habita') || norm.includes('casa') || norm.includes('hous') || norm.includes('rent') || norm.includes('renda')) {
      return 'home-outline';
    }
    if (
      norm.includes('servi') ||
      norm.includes('energ') ||
      norm.includes('água') ||
      norm.includes('agua') ||
      norm.includes('util') ||
      norm.includes('luz') ||
      norm.includes('bill')
    ) {
      return 'flash-outline';
    }
    if (
      norm.includes('telecom') ||
      norm.includes('net') ||
      norm.includes('wifi') ||
      norm.includes('internet') ||
      norm.includes('tv') ||
      norm.includes('phone') ||
      norm.includes('telemóvel') ||
      norm.includes('telemovel')
    ) {
      return 'wifi-outline';
    }
    if (
      norm.includes('saúde') ||
      norm.includes('saude') ||
      norm.includes('health') ||
      norm.includes('medic') ||
      norm.includes('seguro')
    ) {
      return 'shield-checkmark-outline';
    }
    return 'receipt-outline';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar One UI 8.5 */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
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
          {t.fixedExpensesTitle}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cartão de Comprometimento (Screen 2 Mockup) */}
        <View
          style={[
            styles.committedCard,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          <View style={styles.committedHeader}>
            <View>
              <Text style={[styles.committedLabel, { color: colors.textSecondary }]}>
                {t.committedTotal}
              </Text>
              <Text style={[styles.committedAmount, { color: colors.textPrimary }]}>
                {formatCurrency(totalCommitted, currencySymbol)}{' '}
                <Text style={[styles.committedTotal, { color: colors.textMuted }]}>
                  {t.ofTotalFunds} {formatCurrency(totalAllocated, currencySymbol)}
                </Text>
              </Text>
            </View>
            <View style={[styles.percentBadge, { backgroundColor: colors.primaryCyanLight }]}>
              <Text style={[styles.percentBadgeText, { color: colors.primaryCyan }]}>
                {committedPercent.toFixed(0)}%
              </Text>
            </View>
          </View>

          {/* Barra de Progresso */}
          <View style={[styles.trackBg, { backgroundColor: colors.statTrackBg }]}>
            <View
              style={[
                styles.trackFill,
                {
                  width: `${Math.max(4, committedPercent)}%`,
                  backgroundColor: colors.primaryCyan,
                },
              ]}
            />
          </View>

          <View style={styles.variableRow}>
            <Text style={[styles.variableLabel, { color: colors.textSecondary }]}>
              {t.availableForVariables}
            </Text>
            <Text style={[styles.variableValue, { color: colors.accentGreen }]}>
              {formatCurrency(freeForVariables, currencySymbol)}
            </Text>
          </View>
        </View>

        {/* Secção Contas Recorrentes */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t.recurringAccounts}
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={[styles.addLink, { color: colors.primaryCyan }]}>+ {t.add}</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Contas Recorrentes ou Estado Vazio */}
        {fixedExpenses.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              borderWidth: 1,
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
              marginTop: 6,
            }}
          >
            <Ionicons name="receipt-outline" size={42} color={colors.textMuted} style={{ marginBottom: 10 }} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 }}>
              {t.noFixedExpenses}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
              {t.noFixedExpensesSub}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primaryCyan,
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 16,
              }}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                + {t.newFixedExpenseBtn}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.accountList}>
            {fixedExpenses.map((expense) => {
              const paid = isPaidThisMonth(expense.name);
              return (
                <View
                  key={expense.id}
                  style={[
                    styles.accountCard,
                    {
                      backgroundColor: colors.glassSurface,
                      borderColor: paid ? 'rgba(16, 185, 129, 0.35)' : colors.glassBorder,
                      borderTopColor: paid ? 'rgba(16, 185, 129, 0.5)' : colors.glassBorderTop,
                      shadowColor: colors.cardShadow,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: paid ? 'rgba(16, 185, 129, 0.12)' : colors.glassSurfaceElevated,
                        borderColor: paid ? 'rgba(16, 185, 129, 0.3)' : colors.glassBorder,
                        borderTopColor: colors.glassBorderTop,
                      },
                    ]}
                  >
                    <Ionicons
                      name={paid ? 'checkmark-circle' : (getCategoryIcon(expense.category) as any)}
                      size={20}
                      color={paid ? '#10B981' : colors.primaryCyan}
                    />
                  </View>

                  <View style={styles.accountDetails}>
                    <View style={styles.accountNameRow}>
                      <Text style={[styles.accountName, { color: colors.textPrimary }]}>
                        {expense.name}
                      </Text>
                      {paid ? (
                        <View style={styles.paidTag}>
                          <Text style={styles.paidTagText}>{t.paidBadge}</Text>
                        </View>
                      ) : (
                        (() => {
                          if (!expense.due_day || !expense.is_active) return null;
                          const currentDay = now.getDate();
                          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                          let diff = expense.due_day - currentDay;
                          if (diff < 0) diff = (daysInMonth - currentDay) + expense.due_day;
                          if (diff <= 3) {
                            return (
                              <View
                                style={[
                                  styles.paidTag,
                                  {
                                    backgroundColor: diff === 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                    borderColor: diff === 0 ? '#EF4444' : '#F59E0B',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.paidTagText,
                                    { color: diff === 0 ? '#EF4444' : '#D97706', fontWeight: '800' },
                                  ]}
                                >
                                  {diff === 0 ? 'Vence hoje' : `Vence em ${diff}d`}
                                </Text>
                              </View>
                            );
                          }
                          return null;
                        })()
                      )}
                    </View>
                    <Text style={[styles.accountDue, { color: colors.textMuted }]}>
                      {t.dueOnDay} {String(expense.due_day || 1).padStart(2, '0')} • {getFixedExpenseCategoryLabel(expense.category, t)}
                    </Text>
                  </View>

                  <View style={styles.cardRightCol}>
                    <Text style={[styles.accountAmount, { color: colors.textPrimary }]}>
                      {formatCurrency(expense.amount, currencySymbol)}
                    </Text>

                    <View style={styles.actionRow}>
                      {!paid && expense.is_active && (
                        <TouchableOpacity
                          style={[styles.payBtn, { backgroundColor: colors.primaryCyan }]}
                          onPress={() => handlePayFixedExpense(expense)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="card-outline" size={12} color="#FFFFFF" />
                          <Text style={styles.payBtnText}>{t.payExpense}</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => handleRemoveExpense(expense)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.trashBtn}
                      >
                        <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Switch
                    value={expense.is_active}
                    onValueChange={(val) => toggleFixedExpense(expense.id, val)}
                    trackColor={{ false: '#94A3B8', true: colors.primaryCyan }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal Adicionar Conta */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalHeading, { color: colors.textPrimary }]}>
              {t.addFixedExpense}
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.expenseName.toUpperCase()}</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder={t.placeholderExpenseName}
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.expenseAmount.toUpperCase()} ({currencySymbol})</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.primaryCyan, borderColor: colors.border }]}
              placeholder={t.placeholderExpenseAmount}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.selectCategory.toUpperCase()}</Text>
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

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.dueDayFieldLabel}</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder={t.placeholderExpenseDay}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={dueDay}
              onChangeText={setDueDay}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primaryCyan }]}
                onPress={handleSave}
              >
                <Text style={styles.saveText}>{t.saveAccountBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 160,
  },
  committedCard: {
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  committedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  committedLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  committedAmount: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  committedTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  percentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentBadgeText: {
    fontSize: 14,
    fontWeight: '900',
  },
  trackBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
  },
  variableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  variableLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  variableValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  addLink: {
    fontSize: 13,
    fontWeight: '800',
  },
  accountList: {
    gap: 10,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  accountDetails: {
    flex: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '800',
  },
  paidTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  paidTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  accountDue: {
    fontSize: 11,
    marginTop: 2,
  },
  cardRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  accountAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  trashBtn: {
    padding: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelText: {
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
