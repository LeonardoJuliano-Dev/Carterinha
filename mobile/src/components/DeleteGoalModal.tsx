import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../types';
import { getTheme } from '../theme/colors';
import { useFinanceStore } from '../stores/financeStore';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import { useTranslation } from '../i18n/useTranslation';

interface DeleteGoalModalProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
  onConfirmDelete: (goalId: string, reason: string) => Promise<void>;
}

const PREDEFINED_REASONS = [
  {
    id: 'achieved',
    icon: 'trophy-outline' as const,
    iconColor: '#F59E0B',
    label: 'Meta já foi alcançada / concluída',
  },
  {
    id: 'priority_change',
    icon: 'swap-horizontal-outline' as const,
    iconColor: '#06B6D4',
    label: 'Mudança de prioridades financeiras',
  },
  {
    id: 'emergency',
    icon: 'alert-circle-outline' as const,
    iconColor: '#F43F5E',
    label: 'Preciso do dinheiro para uma emergência',
  },
  {
    id: 'mistake',
    icon: 'create-outline' as const,
    iconColor: '#8B5CF6',
    label: 'Criada por engano ou para teste',
  },
  {
    id: 'other',
    icon: 'chatbubble-ellipses-outline' as const,
    iconColor: '#10B981',
    label: 'Outro motivo (especificar abaixo)',
  },
];

export const DeleteGoalModal: React.FC<DeleteGoalModalProps> = ({
  visible,
  goal,
  onClose,
  onConfirmDelete,
}) => {
  const { theme, userProfile } = useFinanceStore();
  const { t } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);

  const [selectedReasonId, setSelectedReasonId] = useState<string>('achieved');
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!goal) return null;

  const handleConfirm = async () => {
    const selectedObj = PREDEFINED_REASONS.find((r) => r.id === selectedReasonId);
    let finalReason = selectedObj ? getReasonLabel(selectedObj.id) : 'Motivo não especificado';
    if (customReasonText.trim()) {
      finalReason += ` — ${customReasonText.trim()}`;
    }

    setIsDeleting(true);
    try {
      await onConfirmDelete(goal.id, finalReason);
      setCustomReasonText('');
      setSelectedReasonId('achieved');
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const getReasonLabel = (id: string) => {
    switch (id) {
      case 'achieved': return t.reasonGoalAchieved;
      case 'priority_change': return t.reasonPriorityChange;
      case 'emergency': return t.reasonEmergency;
      case 'mistake': return t.reasonMistake;
      case 'other': return t.reasonOther;
      default: return id;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
              shadowColor: colors.accentRed,
            },
          ]}
        >
          {/* Cabeçalho de Alerta */}
          <View style={styles.headerRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(225, 29, 72, 0.14)', borderColor: 'rgba(244, 63, 94, 0.3)' }]}>
              <Ionicons name="trash" size={24} color={colors.accentRed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {t.deleteGoalTitle}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {goal.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Aviso sobre fundos poupados */}
            {goal.current_amount > 0 ? (
              <View style={[styles.fundsWarningBox, { backgroundColor: 'rgba(217, 119, 6, 0.12)', borderColor: 'rgba(217, 119, 6, 0.3)' }]}>
                <Ionicons name="information-circle" size={20} color={colors.accentAmber} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fundsWarningTitle, { color: colors.accentAmber }]}>
                    {t.accumulatedBalanceWarning} {formatCurrency(goal.current_amount, currencySymbol)}
                  </Text>
                  <Text style={[styles.fundsWarningText, { color: colors.textSecondary }]}>
                    {t.accumulatedBalanceWarningDesc}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.infoParagraph, { color: colors.textSecondary }]}>
                {t.confirmDeleteGoalDesc} "{goal.name}" ({formatCurrency(goal.target_amount, currencySymbol)})?
              </Text>
            )}

            {/* Pergunta do Motivo */}
            <Text style={[styles.questionLabel, { color: colors.textPrimary }]}>
              {t.deleteGoalDesc}
            </Text>

            {/* Opções de Motivo */}
            <View style={styles.reasonsList}>
              {PREDEFINED_REASONS.map((item) => {
                const isSelected = selectedReasonId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.reasonOption,
                      {
                        backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.12)' : colors.surface,
                        borderColor: isSelected ? colors.primaryCyan : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedReasonId(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? colors.primaryCyan : colors.textMuted}
                    />
                    <View
                      style={[
                        styles.reasonIconBox,
                        {
                          backgroundColor: `${item.iconColor}18`,
                          borderColor: `${item.iconColor}33`,
                        },
                      ]}
                    >
                      <Ionicons name={item.icon} size={15} color={item.iconColor} />
                    </View>
                    <Text
                      style={[
                        styles.reasonLabel,
                        {
                          color: isSelected ? colors.textPrimary : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {getReasonLabel(item.id)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Campo Opcional para Detalhes */}
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder={t.deleteReasonPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={customReasonText}
              onChangeText={setCustomReasonText}
              multiline
              numberOfLines={2}
            />
          </ScrollView>

          {/* Botões de Ação */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                {t.cancel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteBtn,
                { backgroundColor: colors.accentRed },
                isDeleting && { opacity: 0.7 },
              ]}
              onPress={handleConfirm}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>{t.confirmDeleteGoalBtn}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    marginBottom: 16,
  },
  infoParagraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  fundsWarningBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  fundsWarningTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  fundsWarningText: {
    fontSize: 12,
    lineHeight: 17,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  questionHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  reasonsList: {
    gap: 8,
    marginBottom: 14,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  reasonIconBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonLabel: {
    fontSize: 13,
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 52,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    flex: 1.4,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
