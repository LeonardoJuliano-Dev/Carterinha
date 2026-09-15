import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../stores/financeStore';
import { lightTheme, darkTheme, getTheme } from '../theme/colors';
import { TransactionModal } from '../components/TransactionModal';
import { ReceiptScannerModal } from '../components/ReceiptScannerModal';
import { ReceiptExtractionResult, Transaction } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';

interface TransactionsScreenProps {
  onBack?: () => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ onBack }) => {
  const { transactions, addTransaction, editTransaction, deleteTransaction, theme, refreshData, userProfile } = useFinanceStore();
  const { t } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);

  const [filter, setFilter] = useState<'all' | 'essential' | 'lifestyle' | 'savings'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try { await refreshData(); } finally { setIsRefreshing(false); }
  }, [refreshData]);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return transactions.filter((tx) => {
      const isSavings = tx.category === 'savings_goals' || tx.category === 'savings' || !!tx.goal_id;
      const isEssential = !isSavings && (tx.category === 'essential' || tx.is_essential);
      const isLifestyle = !isSavings && !isEssential;

      if (filter === 'savings' && !isSavings) return false;
      if (filter === 'essential' && !isEssential) return false;
      if (filter === 'lifestyle' && !isLifestyle) return false;

      if (timeFilter === 'week') {
        const txDate = new Date(tx.created_at);
        if (txDate < sevenDaysAgo) return false;
      } else if (timeFilter === 'month') {
        if (!tx.created_at.startsWith(currentMonthPrefix)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchStore = tx.store_name
          ? tx.store_name.toLowerCase().includes(q)
          : false;
        return matchDesc || matchStore;
      }
      return true;
    });
  }, [transactions, filter, timeFilter, searchQuery]);

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setTxModalVisible(true);
  };

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      t.delete,
      `${t.deleteTransactionConfirm}\n"${tx.description}" (${formatCurrency(tx.amount, currencySymbol)})`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(tx.id);
          },
        },
      ]
    );
  };

  const handleReceiptExtracted = (extracted: ReceiptExtractionResult) => {
    setEditingTx(null);
    setTxModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar One UI 8.5 em Cristal */}
      <View style={styles.topBar}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar ao início"
            style={[styles.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
          {t.transactionsTitle}
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}
          onPress={() => {
            setEditingTx(null);
            setTxModalVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Adicionar nova despesa"
        >
          <Ionicons name="add" size={22} color={colors.primaryCyan} />
        </TouchableOpacity>
      </View>

      {/* Barra de Pesquisa e Filtros One UI 8.5 */}
      <View
        style={[
          styles.filterSection,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      >
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={t.searchTransactions}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
          style={styles.tabScrollWrapper}
        >
          <TouchableOpacity
            style={[
              styles.tabButton,
              {
                backgroundColor: filter === 'all' ? colors.primaryCyan : colors.glassSurface,
                borderColor: filter === 'all' ? colors.primaryCyan : colors.glassBorder,
              },
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.tabText,
                { color: filter === 'all' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {t.filterAll} ({transactions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              {
                backgroundColor:
                  filter === 'essential' ? 'rgba(0, 229, 255, 0.16)' : colors.glassSurface,
                borderColor: filter === 'essential' ? colors.primaryCyan : colors.glassBorder,
              },
            ]}
            onPress={() => setFilter('essential')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: filter === 'essential' ? colors.primaryCyan : colors.textSecondary,
                  fontWeight: filter === 'essential' ? '800' : '700',
                },
              ]}
            >
              {t.filterEssential}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              {
                backgroundColor:
                  filter === 'lifestyle' ? 'rgba(168, 85, 247, 0.16)' : colors.glassSurface,
                borderColor: filter === 'lifestyle' ? colors.accentPurple : colors.glassBorder,
              },
            ]}
            onPress={() => setFilter('lifestyle')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: filter === 'lifestyle' ? colors.accentPurple : colors.textSecondary,
                  fontWeight: filter === 'lifestyle' ? '800' : '700',
                },
              ]}
            >
              {t.filterLifestyle}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              {
                backgroundColor:
                  filter === 'savings' ? 'rgba(5, 150, 105, 0.16)' : colors.glassSurface,
                borderColor: filter === 'savings' ? colors.accentGreen : colors.glassBorder,
              },
            ]}
            onPress={() => setFilter('savings')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: filter === 'savings' ? colors.accentGreen : colors.textSecondary,
                  fontWeight: filter === 'savings' ? '800' : '700',
                },
              ]}
            >
              {t.filterSavings}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Filtro por Período em Cristal */}
        <View style={styles.timeFilterRow}>
          {[
            { id: 'all', label: 'Todas as Datas' },
            { id: 'month', label: 'Este Mês' },
            { id: 'week', label: 'Últimos 7 Dias' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.timeFilterChip,
                {
                  backgroundColor: timeFilter === tab.id ? colors.primaryCyanLight : colors.glassSurface,
                  borderColor: timeFilter === tab.id ? colors.primaryCyan : colors.glassBorder,
                },
              ]}
              onPress={() => setTimeFilter(tab.id as any)}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar por ${tab.label}`}
            >
              <Text
                style={[
                  styles.timeFilterChipText,
                  {
                    color: timeFilter === tab.id ? colors.primaryCyan : colors.textSecondary,
                    fontWeight: timeFilter === tab.id ? '800' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Lista de Transações com Scroll Livre Totalmente Desbloqueado */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTransactions.length === 0 ? (
          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            <Ionicons
              name="receipt-outline"
              size={36}
              color={colors.primaryCyan}
              style={{ marginBottom: 8 }}
            />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Nenhuma despesa encontrada
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Grave as suas despesas diárias, cole um SMS de M-Pesa/BIM ou digitalize uma fatura.
            </Text>
          </View>
        ) : (
          filteredTransactions.map((tx) => {
            const isSavings = tx.category === 'savings_goals' || tx.category === 'savings' || !!tx.goal_id;
            const isEssential = !isSavings && (tx.category === 'essential' || tx.is_essential);

            const badgeBg = isSavings
              ? 'rgba(16, 185, 129, 0.14)'
              : isEssential
                ? 'rgba(2, 132, 199, 0.12)'
                : 'rgba(147, 51, 234, 0.12)';

            const badgeColor = isSavings
              ? colors.accentGreen
              : isEssential
                ? colors.primaryCyan
                : colors.accentPurple;

            const badgeIcon = isSavings
              ? 'wallet-outline'
              : isEssential
                ? 'checkmark-circle'
                : 'sparkles';

            const badgeLabel = isSavings
              ? 'Poupança (20%)'
              : isEssential
                ? 'Essencial (50%)'
                : 'Lazer (30%)';

            return (
              <View
                key={tx.id}
                style={[
                  styles.txCard,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                    shadowColor: colors.cardShadow,
                  },
                ]}
              >
                <View style={styles.txHeader}>
                  <View style={styles.txTitleRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        {
                          backgroundColor: badgeBg,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        },
                      ]}
                    >
                      <Ionicons
                        name={badgeIcon}
                        size={11}
                        color={badgeColor}
                      />
                      <Text
                        style={[
                          styles.categoryBadgeText,
                          { color: badgeColor },
                        ]}
                      >
                        {badgeLabel}
                      </Text>
                    </View>
                    <Text style={[styles.txTime, { color: colors.textMuted }]}>
                      {new Date(tx.created_at).toLocaleDateString('pt-PT')}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isSavings ? colors.accentGreen : colors.accentRed },
                    ]}
                  >
                    {isSavings ? `+${formatCurrency(tx.amount, currencySymbol, true)}` : `-${formatCurrency(tx.amount, currencySymbol, true)}`}
                  </Text>
                </View>

                <Text style={[styles.txDescription, { color: colors.textPrimary }]}>
                  {tx.description}
                </Text>

                {tx.store_name && (
                  <View
                    style={[
                      styles.storeBadge,
                      {
                        backgroundColor: colors.primaryCyanLight,
                        borderColor: 'rgba(2, 132, 199, 0.18)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      },
                    ]}
                  >
                    <Ionicons name="location-outline" size={11} color={colors.primaryCyan} />
                    <Text style={[styles.storeText, { color: colors.primaryCyan }]}>
                      {tx.store_name}
                    </Text>
                  </View>
                )}

                {/* Caixa de Parecer do Consultor de IA para Gastos Não Essenciais de Lazer */}
                {tx.ai_feedback && !isEssential && !isSavings && (
                  <View
                    style={[
                      styles.aiFeedbackBox,
                      {
                        backgroundColor: 'rgba(168, 85, 247, 0.08)',
                        borderLeftColor: colors.accentPurple,
                      },
                    ]}
                  >
                    <View style={[styles.aiFeedbackHeader, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                      <Ionicons name="sparkles" size={12} color={colors.accentPurple} />
                      <Text style={[styles.aiFeedbackTitle, { color: colors.accentPurple }]}>
                        Parecer do Consultor de IA:
                      </Text>
                    </View>
                    <Text style={[styles.aiFeedbackContent, { color: colors.textSecondary }]}>
                      {tx.ai_feedback}
                    </Text>
                  </View>
                )}

                {/* Botões de Ação: Editar e Eliminar */}
                <View style={styles.txActionRow}>
                  <TouchableOpacity
                    style={[styles.txActionBtn, { backgroundColor: colors.primaryCyanLight, borderColor: 'rgba(2, 132, 199, 0.20)' }]}
                    onPress={() => handleEdit(tx)}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar despesa ${tx.description}`}
                  >
                    <Ionicons name="pencil" size={13} color={colors.primaryCyan} style={{ marginRight: 4 }} />
                    <Text style={[styles.txActionBtnText, { color: colors.primaryCyan }]}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.txActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}
                    onPress={() => handleDelete(tx)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar despesa ${tx.description}`}
                  >
                    <Ionicons name="trash-outline" size={13} color={colors.accentRed} style={{ marginRight: 4 }} />
                    <Text style={[styles.txActionBtnText, { color: colors.accentRed }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Botões de Ação Elevados Acima da Navegação Flutuante */}
      <View style={styles.fabRow}>
        <TouchableOpacity
          style={[
            styles.fabSecondary,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primaryCyan,
              shadowColor: colors.cardShadow,
            },
          ]}
          onPress={() => setScannerModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={18} color={colors.primaryCyan} style={{ marginRight: 6 }} />
          <Text style={[styles.fabSecondaryText, { color: colors.primaryCyan }]}>
            Fatura
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.fabPrimary,
            {
              backgroundColor: colors.primaryCyan,
              shadowColor: colors.primaryCyan,
            },
          ]}
          onPress={() => {
            setEditingTx(null);
            setTxModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.fabPrimaryText}>Nova Despesa</Text>
        </TouchableOpacity>
      </View>

      <TransactionModal
        visible={txModalVisible}
        initialTransaction={editingTx}
        onClose={() => {
          setTxModalVisible(false);
          setEditingTx(null);
        }}
        onSubmit={async (desc, amount, isEssential, cat, store, items) => {
          await addTransaction(desc, amount, isEssential, cat, undefined, store, items);
        }}
        onUpdate={async (id, desc, amount, isEssential, cat, store, items) => {
          await editTransaction(id, {
            description: desc,
            amount,
            isEssential,
            category: cat,
            storeName: store,
            itemsSummary: items,
          });
          setEditingTx(null);
        }}
      />

      <ReceiptScannerModal
        visible={scannerModalVisible}
        onClose={() => setScannerModalVisible(false)}
        onExtracted={handleReceiptExtracted}
      />
    </View>
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
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  tabScrollWrapper: {
    marginBottom: 10,
  },
  tabScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 170, // Espaço amplo para scroll total acima dos botões flutuantes
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  txCard: {
    borderRadius: 26,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  txTime: {
    fontSize: 11,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  txDescription: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  storeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  storeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  aiFeedbackBox: {
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
  },
  aiFeedbackHeader: {
    marginBottom: 4,
  },
  aiFeedbackTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  aiFeedbackContent: {
    fontSize: 12,
    lineHeight: 17,
  },
  fabRow: {
    position: 'absolute',
    bottom: 116,
    right: 16,
    left: 16,
    flexDirection: 'row',
    gap: 10,
  },
  fabSecondary: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fabSecondaryText: {
    fontWeight: '800',
    fontSize: 13,
  },
  fabPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  fabPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  timeFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  timeFilterChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  timeFilterChipText: {
    fontSize: 11,
  },
  txActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  txActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  txActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
