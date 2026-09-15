import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { calculate50_30_20 } from '../utils/budgetCalculations';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { useTranslation } from '../i18n/useTranslation';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';

interface SalaryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (salary: number) => Promise<void>;
  initialSalary?: number;
  monthName?: string;
}

export const SalaryModal: React.FC<SalaryModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialSalary,
  monthName,
}) => {
  const { theme, userProfile, allocation } = useFinanceStore();
  const { t } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);

  const [salaryText, setSalaryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (visible) {
      if (initialSalary && initialSalary > 0) {
        setSalaryText(String(initialSalary));
      } else if (allocation?.total_income && allocation.total_income > 0) {
        setSalaryText(String(allocation.total_income));
      } else {
        setSalaryText('');
      }
      setErrorMessage('');
    }
  }, [visible, initialSalary, allocation]);

  const parsedSalary = parseFloat(salaryText.replace(',', '.')) || 0;
  const preview = calculate50_30_20(parsedSalary);

  const handleSubmit = async () => {
    setErrorMessage('');
    if (parsedSalary <= 0) {
      setErrorMessage(t.errorSalaryValid);
      return;
    }

    try {
      setLoading(true);
      await onSubmit(parsedSalary);
      setSalaryText('');
      onClose();
    } catch (err) {
      setErrorMessage(t.errorRegisterSalary);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
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
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {monthName ? `${t.incomeForMonth} ${monthName}` : t.salaryModalTitle}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {monthName
                  ? `${t.salaryModalSubMonth} (dia habitual: ${userProfile.salaryPayDay || 25})`
                  : t.salaryModalSubDefault}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

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

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {`${t.salaryNetLabel} (${currencySymbol})`}
          </Text>
          <TextInput
            style={[
              styles.salaryInput,
              {
                backgroundColor: colors.glassInputBg,
                color: colors.primaryCyan,
                borderColor: colors.glassBorder,
                borderTopColor: colors.glassBorderTop,
              },
            ]}
            keyboardType="decimal-pad"
            placeholder={t.placeholderExpenseAmount}
            placeholderTextColor={colors.textMuted}
            value={salaryText}
            onChangeText={setSalaryText}
            autoFocus
          />

          {/* Pré-visualização da regra 50/30/20 em tempo real */}
          {parsedSalary > 0 && (
            <View
              style={[
                styles.previewContainer,
                {
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
            >
              <Text style={[styles.previewHeading, { color: colors.textPrimary }]}>
                {t.simulationTitle}:
              </Text>

              <View style={styles.previewRow}>
                <View style={styles.previewLeftRow}>
                  <View style={[styles.dotMarker, { backgroundColor: colors.primaryCyan }]} />
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                    {t.needs50Label}:
                  </Text>
                </View>
                <Text style={[styles.previewValue, { color: colors.primaryCyan }]}>
                  {formatCurrency(preview.needs_50, currencySymbol)}
                </Text>
              </View>

              <View style={styles.previewRow}>
                <View style={styles.previewLeftRow}>
                  <View style={[styles.dotMarker, { backgroundColor: colors.accentPurple }]} />
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                    {t.wants30Label}:
                  </Text>
                </View>
                <Text style={[styles.previewValue, { color: colors.accentPurple }]}>
                  {formatCurrency(preview.wants_30, currencySymbol)}
                </Text>
              </View>

              <View style={styles.previewRow}>
                <View style={styles.previewLeftRow}>
                  <View style={[styles.dotMarker, { backgroundColor: colors.accentGreen }]} />
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                    {t.savings20Label}:
                  </Text>
                </View>
                <Text style={[styles.previewValue, { color: colors.accentGreen }]}>
                  {formatCurrency(preview.savings_20, currencySymbol)}
                </Text>
              </View>
            </View>
          )}

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
                <Text style={styles.submitButtonText}>{t.confirmDistributeSalary}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
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
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  salaryInput: {
    borderRadius: 18,
    fontSize: 26,
    fontWeight: '900',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewContainer: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  previewHeading: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  submitButton: {
    borderRadius: 20,
    marginTop: 6,
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
});
