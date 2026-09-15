import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PriceComparisonResult, ReceiptExtractionResult, Transaction } from '../types';
import { useFinanceStore } from '../stores/financeStore';
import { lightTheme, darkTheme, getTheme } from '../theme/colors';
import { ReceiptScannerModal } from './ReceiptScannerModal';
import { validateFixedExpense } from '../utils/fixedExpenseValidator';
import { useTranslation } from '../i18n/useTranslation';
import { getCurrencySymbol, formatCurrency } from '../utils/formatters';

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    description: string,
    amount: number,
    isEssential: boolean,
    category: string,
    storeName?: string,
    itemsSummary?: string
  ) => Promise<void>;
  initialTransaction?: Transaction | null;
  onUpdate?: (
    id: string,
    description: string,
    amount: number,
    isEssential: boolean,
    category: string,
    storeName?: string,
    itemsSummary?: string
  ) => Promise<void>;
  isAnalyzing?: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialTransaction,
  onUpdate,
  isAnalyzing = false,
}) => {
  const { theme, checkPriceComparison, userProfile, fixedExpenses, addFixedExpense } = useFinanceStore();
  const { t } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);

  const [description, setDescription] = useState('');
  const [amountText, setAmountText] = useState('');
  const [storeName, setStoreName] = useState('');
  const [isEssential, setIsEssential] = useState(true);
  const [category, setCategory] = useState('essential');
  const [itemsSummary, setItemsSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Scanner de faturas
  const [scannerVisible, setScannerVisible] = useState(false);

  // Modal de Validação de Despesa Fixa
  const [fixedWarning, setFixedWarning] = useState<{
    reason: string;
    description: string;
    amount: number;
  } | null>(null);

  // Inteligência de preços
  const [priceIntelligence, setPriceIntelligence] = useState<PriceComparisonResult | null>(null);

  // Carregar dados existentes em modo edição ou resetar ao abrir novo
  useEffect(() => {
    if (initialTransaction) {
      setDescription(initialTransaction.description || '');
      setAmountText(String(initialTransaction.amount || ''));
      setStoreName(initialTransaction.store_name || '');
      setIsEssential(initialTransaction.is_essential);
      const isSav =
        initialTransaction.category === 'savings_goals' ||
        initialTransaction.category === 'savings' ||
        !!initialTransaction.goal_id;
      const initialCat = isSav
        ? 'savings_goals'
        : initialTransaction.category || (initialTransaction.is_essential ? 'essential' : 'lifestyle');
      setCategory(initialCat);
      setItemsSummary(initialTransaction.items_summary || '');
    } else if (visible) {
      setDescription('');
      setAmountText('');
      setStoreName('');
      setIsEssential(true);
      setCategory('essential');
      setItemsSummary('');
      setPriceIntelligence(null);
    }
    setErrorMessage('');
  }, [initialTransaction, visible]);

  // Verifica comparação de preços quando o utilizador preenche valor e descrição
  useEffect(() => {
    const numAmount = parseFloat(amountText.replace(',', '.'));
    if (description.trim().length >= 3 && !isNaN(numAmount) && numAmount > 0) {
      const timer = setTimeout(async () => {
        try {
          const res = await checkPriceComparison(
            description.trim(),
            numAmount,
            storeName.trim() || undefined
          );
          setPriceIntelligence(res);
        } catch {
          // fallback
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setPriceIntelligence(null);
    }
  }, [description, amountText, storeName]);

  const handleSelectCategory = (cat: 'essential' | 'lifestyle' | 'savings_goals') => {
    setCategory(cat);
    setIsEssential(cat === 'essential');
  };

  const handleReceiptExtracted = (extracted: ReceiptExtractionResult) => {
    if (extracted.store_name) setStoreName(extracted.store_name);
    if (extracted.total_amount) setAmountText(extracted.total_amount.toFixed(2));
    if (extracted.category) {
      setIsEssential(extracted.is_essential);
      setCategory(extracted.category);
    }
    if (extracted.items && extracted.items.length > 0) {
      setDescription(extracted.items[0].name);
      setItemsSummary(
        extracted.items.map((i) => `${i.name} (${i.price.toFixed(2)} MT)`).join(', ')
      );
    }
  };

  const executeSave = async (
    desc: string,
    amount: number,
    isEss: boolean,
    cat: string
  ) => {
    try {
      setLoading(true);
      if (initialTransaction && onUpdate) {
        await onUpdate(
          initialTransaction.id,
          desc,
          amount,
          isEss,
          cat,
          storeName.trim() || undefined,
          itemsSummary.trim() || undefined
        );
      } else {
        await onSubmit(
          desc,
          amount,
          isEss,
          cat,
          storeName.trim() || undefined,
          itemsSummary.trim() || undefined
        );
      }
      setFixedWarning(null);
      onClose();
    } catch (err) {
      setErrorMessage('Ocorreu um erro ao gravar a transação.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    const parsedAmount = parseFloat(amountText.replace(',', '.'));

    if (!description.trim()) {
      setErrorMessage('Por favor, informe a descrição do gasto.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Por favor, insira um valor válido e superior a zero.');
      return;
    }

    // Se estiver a debitar das Fixas (50%), validar se é realmente uma despesa fixa
    if (category === 'essential') {
      const validation = validateFixedExpense(description.trim(), fixedExpenses);
      if (!validation.isValidFixed) {
        setFixedWarning({
          reason:
            validation.reason ||
            'Esta despesa não coincide com nenhuma das tuas contas fixas cadastradas.',
          description: description.trim(),
          amount: parsedAmount,
        });
        return;
      }
    }

    await executeSave(description.trim(), parsedAmount, isEssential, category);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.glassSurfaceElevated,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
        >
          <View
            style={[
              styles.handleBar,
              { backgroundColor: theme === 'light' ? '#CBD5E1' : '#334155' },
            ]}
          />

          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {initialTransaction ? t.editExpenseTitle : t.newExpenseTitle}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {initialTransaction ? 'Altere os dados da despesa gravada' : 'Adicione manualmente ou fotografe a fatura'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal de despesa"
              style={[
                styles.closeButton,
                { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderTopColor: colors.glassBorderTop },
              ]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {errorMessage ? (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: 'rgba(225, 29, 72, 0.12)', borderColor: colors.accentRed },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.accentRed }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Botão de Destaque: Digitalizar Fatura com IA */}
            <TouchableOpacity
              style={[
                styles.scanReceiptBtn,
                {
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.primaryCyan,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
              onPress={() => setScannerVisible(true)}
            >
              <View
                style={[
                  styles.scanIconBg,
                  { backgroundColor: colors.primaryCyanLight },
                ]}
              >
                <Ionicons name="camera" size={20} color={colors.primaryCyan} />
              </View>
              <View style={styles.scanTextContainer}>
                <Text style={[styles.scanBtnTitle, { color: colors.textPrimary }]}>
                  {t.scanReceiptTitle}
                </Text>
                <Text style={[styles.scanBtnSub, { color: colors.textSecondary }]}>
                  {t.scanReceiptSub}
                </Text>
              </View>
              <View
                style={[
                  styles.scanPill,
                  { backgroundColor: colors.primaryCyan },
                ]}
              >
                <Text style={styles.scanPillText}>{t.aiBadge}</Text>
              </View>
            </TouchableOpacity>

            {/* Valor */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {`${t.expenseAmountLabel} (${currencySymbol})`}
            </Text>
            <TextInput
              style={[
                styles.amountInput,
                {
                  backgroundColor: colors.glassInputBg,
                  color: colors.primaryCyan,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
              keyboardType="decimal-pad"
              placeholder={t.amountPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={amountText}
              onChangeText={setAmountText}
            />

            {/* Descrição / O que comprou */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t.itemBoughtLabel}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.glassInputBg,
                  color: colors.textPrimary,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
              placeholder={t.itemBoughtPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
            />

            {/* Estabelecimento / Onde gastou */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t.storeLabel}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.glassInputBg,
                  color: colors.textPrimary,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
              placeholder={t.storePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={storeName}
              onChangeText={setStoreName}
            />

            {/* Badge de Inteligência de Preços */}
            {priceIntelligence && (
              <View
                style={[
                  styles.priceBadge,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: priceIntelligence.is_more_expensive
                      ? colors.accentAmber
                      : priceIntelligence.is_cheaper
                      ? colors.accentGreen
                      : colors.primaryCyan,
                  },
                ]}
              >
                <Ionicons
                  name={
                    priceIntelligence.is_more_expensive
                      ? 'alert-circle'
                      : priceIntelligence.is_cheaper
                      ? 'gift'
                      : 'bulb'
                  }
                  size={20}
                  color={
                    priceIntelligence.is_more_expensive
                      ? colors.accentAmber
                      : priceIntelligence.is_cheaper
                      ? colors.accentGreen
                      : colors.primaryCyan
                  }
                />
                <View style={styles.priceBadgeContent}>
                  <Text
                    style={[
                      styles.priceBadgeTitle,
                      {
                        color: priceIntelligence.is_more_expensive
                          ? colors.accentAmber
                          : priceIntelligence.is_cheaper
                          ? colors.accentGreen
                          : colors.primaryCyan,
                      },
                    ]}
                  >
                    {priceIntelligence.is_more_expensive
                      ? 'Preço Superior ao Histórico'
                      : priceIntelligence.is_cheaper
                      ? 'Poupança Identificada!'
                      : 'Comparador de Preços'}
                  </Text>
                  <Text style={[styles.priceBadgeMessage, { color: colors.textPrimary }]}>
                    {priceIntelligence.message}
                  </Text>
                  {priceIntelligence.saving_tip && (
                    <Text style={[styles.priceBadgeTip, { color: colors.textSecondary }]}>
                      {priceIntelligence.saving_tip}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Seletor de Classificação 50 / 30 / 20 */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              CLASSIFICAÇÃO DO ORÇAMENTO (50 / 30 / 20)
            </Text>
            <View style={styles.toggleRow}>
              {/* Essencial (50%) */}
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: category === 'essential'
                      ? colors.primaryCyanLight
                      : colors.glassSurface,
                    borderColor: category === 'essential' ? colors.primaryCyan : colors.glassBorder,
                    borderTopColor: category === 'essential' ? colors.primaryCyan : colors.glassBorderTop,
                  },
                ]}
                onPress={() => handleSelectCategory('essential')}
              >
                <View style={styles.toggleTitleRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color={category === 'essential' ? colors.primaryCyan : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      { color: category === 'essential' ? colors.primaryCyan : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    Essencial
                  </Text>
                </View>
                <Text style={[styles.toggleSubtext, { color: colors.textMuted }]}>
                  Fixas (50%)
                </Text>
              </TouchableOpacity>

              {/* Lazer (30%) */}
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: category === 'lifestyle'
                      ? 'rgba(168, 85, 247, 0.16)'
                      : colors.glassSurface,
                    borderColor: category === 'lifestyle' ? colors.accentPurple : colors.glassBorder,
                    borderTopColor: category === 'lifestyle' ? colors.accentPurple : colors.glassBorderTop,
                  },
                ]}
                onPress={() => handleSelectCategory('lifestyle')}
              >
                <View style={styles.toggleTitleRow}>
                  <Ionicons
                    name="sparkles"
                    size={13}
                    color={category === 'lifestyle' ? colors.accentPurple : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      { color: category === 'lifestyle' ? colors.accentPurple : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    Lazer
                  </Text>
                </View>
                <Text style={[styles.toggleSubtext, { color: colors.textMuted }]}>
                  Estilo (30%)
                </Text>
              </TouchableOpacity>

              {/* Poupança (20%) */}
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: category === 'savings_goals'
                      ? 'rgba(16, 185, 129, 0.16)'
                      : colors.glassSurface,
                    borderColor: category === 'savings_goals' ? colors.accentGreen : colors.glassBorder,
                    borderTopColor: category === 'savings_goals' ? colors.accentGreen : colors.glassBorderTop,
                  },
                ]}
                onPress={() => handleSelectCategory('savings_goals')}
              >
                <View style={styles.toggleTitleRow}>
                  <Ionicons
                    name="wallet-outline"
                    size={13}
                    color={category === 'savings_goals' ? colors.accentGreen : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      { color: category === 'savings_goals' ? colors.accentGreen : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    Poupança
                  </Text>
                </View>
                <Text style={[styles.toggleSubtext, { color: colors.textMuted }]}>
                  Metas (20%)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Chips de Contas Fixas Cadastradas para Seleção Rápida */}
            {category === 'essential' && fixedExpenses.length > 0 && (
              <View style={styles.fixedChipsSection}>
                <View style={styles.fixedChipsHeader}>
                  <Ionicons name="pin" size={12} color={colors.primaryCyan} />
                  <Text style={[styles.fixedChipsTitle, { color: colors.textSecondary }]}>
                    AS TUAS CONTAS FIXAS REGISTADAS (1-TOQUE):
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.fixedChipsScroll}
                >
                  {fixedExpenses.map((fe) => (
                    <TouchableOpacity
                      key={fe.id}
                      style={[
                        styles.fixedChip,
                        {
                          backgroundColor:
                            description.trim().toLowerCase() === fe.name.toLowerCase()
                              ? colors.primaryCyanLight
                              : colors.glassSurface,
                          borderColor:
                            description.trim().toLowerCase() === fe.name.toLowerCase()
                              ? colors.primaryCyan
                              : colors.glassBorder,
                        },
                      ]}
                      onPress={() => {
                        setDescription(fe.name);
                        setAmountText(String(fe.amount));
                        setCategory('essential');
                        setIsEssential(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={12}
                        color={
                          description.trim().toLowerCase() === fe.name.toLowerCase()
                            ? colors.primaryCyan
                            : colors.textMuted
                        }
                      />
                      <Text
                        style={[
                          styles.fixedChipText,
                          {
                            color:
                              description.trim().toLowerCase() === fe.name.toLowerCase()
                                ? colors.primaryCyan
                                : colors.textPrimary,
                            fontWeight:
                              description.trim().toLowerCase() === fe.name.toLowerCase()
                                ? '800'
                                : '600',
                          },
                        ]}
                      >
                        {fe.name} ({formatCurrency(fe.amount, currencySymbol)})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Banner Informativo do Consultor IA quando for Não Essencial */}
            {category === 'lifestyle' && (
              <View
                style={[
                  styles.aiAlertBox,
                  {
                    backgroundColor: 'rgba(147, 51, 234, 0.12)',
                    borderColor: 'rgba(168, 85, 247, 0.35)',
                    borderLeftColor: colors.accentPurple,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Ionicons name="sparkles" size={14} color={colors.accentPurple} />
                  <Text style={[styles.aiAlertTitle, { color: colors.accentPurple }]}>
                    Consultor Proativo Ativo
                  </Text>
                </View>
                <Text style={[styles.aiAlertText, { color: colors.textSecondary }]}>
                  Despesas de lazer ativam a avaliação inteligente do Consultor IA para evitar fugas desnecessárias no orçamento.
                </Text>
              </View>
            )}

            {/* Banner Informativo de Poupança */}
            {category === 'savings_goals' && (
              <View
                style={[
                  styles.aiAlertBox,
                  {
                    backgroundColor: 'rgba(16, 185, 129, 0.10)',
                    borderColor: 'rgba(16, 185, 129, 0.30)',
                    borderLeftColor: colors.accentGreen,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Ionicons name="shield-checkmark" size={14} color={colors.accentGreen} />
                  <Text style={[styles.aiAlertTitle, { color: colors.accentGreen }]}>
                    Alocação para o Futuro
                  </Text>
                </View>
                <Text style={[styles.aiAlertText, { color: colors.textSecondary }]}>
                  Este montante reforça a tua poupança ou alimenta uma meta de vida definida.
                </Text>
              </View>
            )}

            {/* Botão de Gravar / Guardar */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { shadowColor: colors.primaryCyan },
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={colors.gradients.cyan}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {initialTransaction ? t.updateExpenseBtn : t.saveExpenseBtn}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Modal do Scanner de Faturas */}
      <ReceiptScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onExtracted={handleReceiptExtracted}
      />

      {/* Modal Elegante One UI de Validação de Despesa Fixa */}
      <Modal
        visible={!!fixedWarning}
        animationType="fade"
        transparent
        onRequestClose={() => setFixedWarning(null)}
      >
        <View style={styles.fixedWarningOverlay}>
          <View
            style={[
              styles.fixedWarningCard,
              {
                backgroundColor: colors.glassSurfaceElevated,
                borderColor: colors.accentAmber,
                shadowColor: colors.accentAmber,
              },
            ]}
          >
            <View style={[styles.fixedWarningIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.16)' }]}>
              <Ionicons name="alert-circle-outline" size={32} color={colors.accentAmber} />
            </View>

            <Text style={[styles.fixedWarningTitle, { color: colors.textPrimary }]}>
              {t.fixedValidationTitle}
            </Text>

            <Text style={[styles.fixedWarningReason, { color: colors.textSecondary }]}>
              {fixedWarning?.reason}
            </Text>

            <View style={[styles.fixedWarningItemBadge, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}>
              <Text style={[styles.fixedWarningItemText, { color: colors.primaryCyan }]}>
                {fixedWarning?.description} • {fixedWarning?.amount.toFixed(2)} MT
              </Text>
            </View>

            <Text style={[styles.fixedWarningSub, { color: colors.textMuted }]}>
              {t.fixedValidationSub}
            </Text>

            {/* Opção 1: Mudar para Lazer (Recomendado) */}
            <TouchableOpacity
              style={[styles.warningActionBtn, { backgroundColor: colors.accentPurple }]}
              onPress={async () => {
                if (fixedWarning) {
                  setCategory('lifestyle');
                  setIsEssential(false);
                  await executeSave(fixedWarning.description, fixedWarning.amount, false, 'lifestyle');
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.warningActionBtnText}>{t.changeToLifestyleRecommended}</Text>
            </TouchableOpacity>

            {/* Opção 2: Cadastrar como Nova Conta Fixa */}
            <TouchableOpacity
              style={[styles.warningActionSecondaryBtn, { backgroundColor: colors.primaryCyanLight, borderColor: colors.primaryCyan }]}
              onPress={async () => {
                if (fixedWarning) {
                  await addFixedExpense(fixedWarning.description, fixedWarning.amount, 'serviços', 1);
                  await executeSave(fixedWarning.description, fixedWarning.amount, true, 'essential');
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.primaryCyan} style={{ marginRight: 6 }} />
              <Text style={[styles.warningActionSecondaryText, { color: colors.primaryCyan }]}>
                {t.addToRecurringFixed}
              </Text>
            </TouchableOpacity>

            {/* Opção 3: Manter como Fixa Pontual */}
            <TouchableOpacity
              style={[styles.warningActionTertiaryBtn, { borderColor: colors.glassBorder }]}
              onPress={async () => {
                if (fixedWarning) {
                  await executeSave(fixedWarning.description, fixedWarning.amount, true, 'essential');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.warningActionTertiaryText, { color: colors.textSecondary }]}>
                {t.keepAsOneTimeFixed}
              </Text>
            </TouchableOpacity>

            {/* Cancelar */}
            <TouchableOpacity
              style={{ marginTop: 8, paddingVertical: 8, alignItems: 'center' }}
              onPress={() => setFixedWarning(null)}
            >
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
    borderWidth: 1,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scanReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  scanIconBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanTextContainer: {
    flex: 1,
  },
  scanBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  scanBtnSub: {
    fontSize: 11,
    marginTop: 2,
  },
  scanPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scanPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  amountInput: {
    borderRadius: 18,
    fontSize: 26,
    fontWeight: '900',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  textInput: {
    borderRadius: 16,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  priceBadge: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    alignItems: 'flex-start',
    gap: 10,
  },
  priceBadgeContent: {
    flex: 1,
  },
  priceBadgeTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  priceBadgeMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  priceBadgeTip: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  toggleSubtext: {
    fontSize: 10,
  },
  aiAlertBox: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
  },
  aiAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  aiAlertText: {
    fontSize: 11,
    lineHeight: 15,
  },
  submitButton: {
    borderRadius: 20,
    marginTop: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fixedChipsSection: {
    marginTop: 14,
    marginBottom: 8,
  },
  fixedChipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  fixedChipsTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  fixedChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  fixedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  fixedChipText: {
    fontSize: 12,
  },
  fixedWarningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fixedWarningCard: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fixedWarningIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  fixedWarningTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  fixedWarningReason: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  fixedWarningItemBadge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: 14,
  },
  fixedWarningItemText: {
    fontSize: 13,
    fontWeight: '800',
  },
  fixedWarningSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  warningActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  warningActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  warningActionSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  warningActionSecondaryText: {
    fontSize: 13,
    fontWeight: '800',
  },
  warningActionTertiaryBtn: {
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningActionTertiaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
