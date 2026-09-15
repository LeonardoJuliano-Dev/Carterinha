import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import {
  parseFinancialNotification,
  ParsedFinancialMessage,
  SAMPLE_MOZAMBICAN_MESSAGES,
} from '../services/smsNotificationParser';
import { useTranslation } from '../i18n/useTranslation';
import { formatCurrency } from '../utils/formatters';

interface SmsNotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SmsNotificationModal: React.FC<SmsNotificationModalProps> = ({
  visible,
  onClose,
}) => {
  const { t, currencySymbol } = useTranslation();
  const { theme, userProfile, smsListenerEnabled, setSmsListenerEnabled, processIncomingSms } =
    useFinanceStore();
  const colors = getTheme(theme, userProfile.primaryColor);

  const [inputMessage, setInputMessage] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedFinancialMessage | null>(null);
  const [recordedSuccess, setRecordedSuccess] = useState(false);

  const handleMessageChange = (text: string) => {
    setInputMessage(text);
    setRecordedSuccess(false);
    if (text.trim().length > 10) {
      const parsed = parseFinancialNotification(text);
      setParsedPreview(parsed);
    } else {
      setParsedPreview(null);
    }
  };

  const handleSelectSample = (sampleText: string) => {
    setInputMessage(sampleText);
    setRecordedSuccess(false);
    const parsed = parseFinancialNotification(sampleText);
    setParsedPreview(parsed);
  };

  const handleRegister = async () => {
    if (!inputMessage.trim()) return;
    const result = await processIncomingSms(inputMessage.trim());
    if (result) {
      setRecordedSuccess(true);
      setInputMessage('');
      setTimeout(() => {
        setParsedPreview(null);
        setRecordedSuccess(false);
        onClose();
      }, 1200);
    } else {
      Alert.alert(
        'Mensagem Não Reconhecida',
        'Não foi possível identificar o valor ou a instituição bancária no texto. Verifique o formato da mensagem.'
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.glassSurfaceElevated,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
        >
          {/* Barra superior de arraste */}
          <View
            style={[
              styles.handle,
              { backgroundColor: theme === 'light' ? '#CBD5E1' : '#334155' },
            ]}
          />

          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: colors.primaryCyanLight },
                ]}
              >
                <Ionicons name="notifications" size={20} color={colors.primaryCyan} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {t.smsModalTitle}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t.smsModalSubtitle}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Secção de Permissão One UI */}
            <View
              style={[
                styles.permissionBox,
                {
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
                  {t.autoSmsDetection}
                </Text>
                <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
                  {t.autoSmsDesc}
                </Text>
              </View>
              <Switch
                value={smsListenerEnabled}
                onValueChange={setSmsListenerEnabled}
                trackColor={{ false: '#94A3B8', true: colors.primaryCyan }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Caixa de Entrada / Colar SMS */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {t.pasteOrSimulate}
            </Text>
            <TextInput
              style={[
                styles.inputArea,
                {
                  backgroundColor: colors.glassInputBg,
                  color: colors.textPrimary,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
              multiline
              numberOfLines={3}
              placeholder={t.smsPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={inputMessage}
              onChangeText={handleMessageChange}
            />

            {/* Exemplos Rápidos para Testar */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              {t.mozambiqueSamples}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.samplesScroll}>
              {SAMPLE_MOZAMBICAN_MESSAGES.map((sample, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.samplePill,
                    {
                      backgroundColor: colors.glassSurface,
                      borderColor: colors.glassBorder,
                      borderTopColor: colors.glassBorderTop,
                    },
                  ]}
                  onPress={() => handleSelectSample(sample.text)}
                >
                  <Text style={[styles.sampleLabel, { color: colors.primaryCyan }]}>
                    {sample.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Pré-visualização da Extração */}
            {parsedPreview && (
              <View
                style={[
                  styles.previewBox,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.primaryCyan,
                    borderTopColor: colors.glassBorderTop,
                  },
                ]}
              >
                <View style={styles.previewHeader}>
                  <View
                    style={[
                      styles.instBadge,
                      { backgroundColor: colors.primaryCyanLight },
                    ]}
                  >
                    <Text style={[styles.instBadgeText, { color: colors.primaryCyan }]}>
                      {parsedPreview.institution}
                    </Text>
                  </View>
                  <Text style={[styles.previewAmount, { color: colors.accentRed }]}>
                    -{formatCurrency(parsedPreview.amount, currencySymbol)}
                  </Text>
                </View>

                <View style={styles.previewDetailRow}>
                  <Text style={[styles.previewField, { color: colors.textSecondary }]}>
                    {t.recipientOrStore}
                  </Text>
                  <Text style={[styles.previewValue, { color: colors.textPrimary }]}>
                    {parsedPreview.storeOrRecipient}
                  </Text>
                </View>

                <View style={styles.previewDetailRow}>
                  <Text style={[styles.previewField, { color: colors.textSecondary }]}>
                    {t.rule503020}
                  </Text>
                  <Text
                    style={[
                      styles.previewValue,
                      {
                        color: parsedPreview.isEssential
                          ? colors.accentBlue
                          : colors.accentPurple,
                        fontWeight: '800',
                      },
                    ]}
                  >
                    {parsedPreview.isEssential ? t.essentialCategory : t.lifestyleCategory}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    { shadowColor: recordedSuccess ? colors.accentGreen : colors.primaryCyan },
                  ]}
                  onPress={handleRegister}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={recordedSuccess ? colors.gradients.green : colors.gradients.cyan}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmGradient}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {recordedSuccess && <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />}
                      <Text style={styles.confirmBtnText}>
                        {recordedSuccess ? t.transactionRecorded : t.saveThisExpense}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '88%',
    borderWidth: 1,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  permissionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  permissionDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputArea: {
    borderRadius: 18,
    padding: 14,
    fontSize: 13,
    borderWidth: 1,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  samplesScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  samplePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
  },
  sampleLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewBox: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    marginTop: 6,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  instBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  instBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  previewAmount: {
    fontSize: 20,
    fontWeight: '900',
  },
  previewDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewField: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  confirmBtn: {
    borderRadius: 18,
    marginTop: 12,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
