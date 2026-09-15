import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { useTranslation } from '../i18n/useTranslation';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';

export const SalaryConfirmationModal: React.FC = () => {
  const {
    pendingSalaryConfirmation,
    confirmSalaryIncome,
    dismissSalaryConfirmation,
    theme,
    userProfile,
  } = useFinanceStore();

  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  if (!pendingSalaryConfirmation) return null;

  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);
  const confirmedCount = userProfile.salaryConfirmedMonthsCount || 0;

  const handleConfirm = async (updateBase: boolean) => {
    setLoading(true);
    try {
      await confirmSalaryIncome(updateBase);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={Boolean(pendingSalaryConfirmation)}
      animationType="fade"
      transparent
      onRequestClose={dismissSalaryConfirmation}
    >
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
          {/* Top handle */}
          <View
            style={[
              styles.handleBar,
              { backgroundColor: theme === 'light' ? '#CBD5E1' : '#334155' },
            ]}
          />

          {/* Icon and Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: theme === 'light' ? '#E0F2FE' : 'rgba(2, 132, 199, 0.2)' },
              ]}
            >
              <Ionicons name="cash-outline" size={32} color={colors.primaryCyan} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Salário Detetado!
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Entrada identificada no {pendingSalaryConfirmation.institution} na janela de pagamento (25 a 5).
            </Text>
          </View>

          {/* Amount Box */}
          <View
            style={[
              styles.amountCard,
              {
                backgroundColor: theme === 'light' ? '#F8FAFC' : 'rgba(255, 255, 255, 0.04)',
                borderColor: colors.glassBorder,
              },
            ]}
          >
            <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
              Montante Recebido
            </Text>
            <Text style={[styles.amountValue, { color: colors.primaryCyan }]}>
              {formatCurrency(pendingSalaryConfirmation.amount, currencySymbol)}
            </Text>
            <View style={styles.statusBadge}>
              <Ionicons name="time-outline" size={14} color="#059669" />
              <Text style={styles.statusBadgeText}>
                Confirmação {confirmedCount + 1} de 2
              </Text>
            </View>
          </View>

          {/* Explanation */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Este valor corresponde ao teu salário deste mês? Se confirmares, o Carterinha ajustará a tua alocação 50/30/20.
          </Text>

          {/* Progress note */}
          <View
            style={[
              styles.tipBox,
              {
                backgroundColor: theme === 'light' ? '#EFF6FF' : 'rgba(59, 130, 246, 0.1)',
                borderColor: theme === 'light' ? '#BFDBFE' : 'rgba(59, 130, 246, 0.2)',
              },
            ]}
          >
            <Ionicons name="sparkles-outline" size={16} color="#2563EB" />
            <Text style={[styles.tipText, { color: theme === 'light' ? '#1E40AF' : '#93C5FD' }]}>
              Após 2 confirmações manuais, a atualização deste valor passará a ser 100% automática!
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.buttonContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primaryCyan} style={{ marginVertical: 12 }} />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  activeOpacity={0.8}
                  onPress={() => handleConfirm(true)}
                >
                  <LinearGradient
                    colors={colors.gradients.cyan}
                    style={styles.btnGradient}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>
                      Sim, é o meu salário
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryBtn,
                    {
                      borderColor: colors.glassBorder,
                      backgroundColor: theme === 'light' ? '#F1F5F9' : 'rgba(255, 255, 255, 0.05)',
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleConfirm(false)}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
                    Apenas registar entrada sem alterar base
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dismissBtn}
                  activeOpacity={0.7}
                  onPress={dismissSalaryConfirmation}
                >
                  <Text style={[styles.dismissBtnText, { color: colors.textMuted }]}>
                    Não é o meu salário (Ignorar)
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  amountCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 12,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 18,
  },
  tipText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  buttonContainer: {
    gap: 10,
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  dismissBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
