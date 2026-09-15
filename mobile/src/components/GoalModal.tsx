import React, { useState } from 'react';
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
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { useTranslation } from '../i18n/useTranslation';
import { getCurrencySymbol } from '../utils/formatters';

interface GoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, targetAmount: number, deadline?: string) => Promise<void>;
  initialName?: string;
  initialTargetAmount?: number;
}

// ─── Mini Calendário Inline ───
const WEEKDAY_LABELS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatMonthLabel(year: number, month: number, language: 'pt' | 'en'): string {
  const monthsPt = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const list = language === 'en' ? monthsEn : monthsPt;
  return `${list[month]} ${year}`;
}

function toDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

interface InlineCalendarProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  primaryColor: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  surfaceBg: string;
  borderColor: string;
  language: 'pt' | 'en';
}

const InlineCalendar: React.FC<InlineCalendarProps> = ({
  selectedDate,
  onSelectDate,
  primaryColor,
  textPrimary,
  textSecondary,
  textMuted,
  surfaceBg,
  borderColor,
  language,
}) => {
  const today = new Date();
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const weekdayLabels = language === 'en' ? WEEKDAY_LABELS_EN : WEEKDAY_LABELS_PT;

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const goNext = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goPrev = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={[calStyles.container, { backgroundColor: surfaceBg, borderColor }]}>
      {/* Header: Nav */}
      <View style={calStyles.header}>
        <TouchableOpacity onPress={goPrev} disabled={!canGoPrev} style={calStyles.navBtn}>
          <Ionicons
            name="chevron-back"
            size={18}
            color={canGoPrev ? textPrimary : textMuted}
          />
        </TouchableOpacity>
        <Text style={[calStyles.monthLabel, { color: textPrimary }]}>
          {formatMonthLabel(viewYear, viewMonth, language)}
        </Text>
        <TouchableOpacity onPress={goNext} style={calStyles.navBtn}>
          <Ionicons name="chevron-forward" size={18} color={textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Weekday labels */}
      <View style={calStyles.weekRow}>
        {weekdayLabels.map((w) => (
          <Text key={w} style={[calStyles.weekLabel, { color: textMuted }]}>
            {w}
          </Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={calStyles.grid}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={calStyles.dayCell} />;
          }
          const dateStr = toDateString(viewYear, viewMonth, day);
          const isPast = dateStr < todayStr;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;

          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                calStyles.dayCell,
                isSelected && { backgroundColor: primaryColor, borderRadius: 20 },
                isToday && !isSelected && { borderWidth: 1.5, borderColor: primaryColor, borderRadius: 20 },
              ]}
              disabled={isPast}
              onPress={() => onSelectDate(dateStr)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  calStyles.dayText,
                  { color: isPast ? textMuted : textPrimary },
                  isSelected && { color: '#FFFFFF', fontWeight: '800' },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const calStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navBtn: {
    padding: 4,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

// ─── GoalModal Principal ───

export const GoalModal: React.FC<GoalModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialName = '',
  initialTargetAmount,
}) => {
  const { theme, userProfile } = useFinanceStore();
  const { t, language } = useTranslation();
  const currencySymbol = getCurrencySymbol(userProfile.currency);
  const colors = getTheme(theme, userProfile.primaryColor);

  const [name, setName] = useState(initialName);
  const [amountText, setAmountText] = useState(initialTargetAmount ? String(initialTargetAmount) : '');
  const [deadline, setDeadline] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (visible) {
      setName(initialName || '');
      setAmountText(initialTargetAmount ? String(initialTargetAmount) : '');
      setDeadline('');
      setShowCalendar(false);
      setErrorMessage('');
    }
  }, [visible, initialName, initialTargetAmount]);

  const handleSubmit = async () => {
    setErrorMessage('');
    const targetAmount = parseFloat(amountText.replace(',', '.'));

    if (!name.trim()) {
      setErrorMessage(t.errorGoalName);
      return;
    }
    if (isNaN(targetAmount) || targetAmount <= 0) {
      setErrorMessage(t.errorGoalTarget);
      return;
    }

    try {
      setLoading(true);
      await onSubmit(name.trim(), targetAmount, deadline.trim() || undefined);
      setName('');
      setAmountText('');
      setDeadline('');
      onClose();
    } catch (err) {
      setErrorMessage(t.errorProcessingGoal);
    } finally {
      setLoading(false);
    }
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
                {initialName ? t.modalTitleGoalEdit : t.modalTitleGoalNew}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {t.modalSubGoal}
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

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.goalNameLabel}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.glassInputBg,
                  color: colors.textPrimary,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
              placeholder={t.goalNamePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {`${t.targetAmountLabel} (${currencySymbol})`}
            </Text>
            <TextInput
              style={[
                styles.amountInput,
                {
                  backgroundColor: colors.glassInputBg,
                  color: colors.accentGreen,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
              keyboardType="decimal-pad"
              placeholder={t.targetAmountPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={amountText}
              onChangeText={setAmountText}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t.deadlineLabel}
            </Text>

            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  backgroundColor: colors.glassInputBg,
                  borderColor: showCalendar ? colors.primaryCyan : colors.glassBorder,
                },
              ]}
              onPress={() => setShowCalendar(!showCalendar)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={deadline ? colors.primaryCyan : colors.textMuted}
              />
              <Text
                style={[
                  styles.dateButtonText,
                  { color: deadline ? colors.textPrimary : colors.textMuted },
                ]}
              >
                {deadline ? formatDisplayDate(deadline) : t.deadlineSelectCalendar}
              </Text>
              {deadline ? (
                <TouchableOpacity
                  onPress={() => {
                    setDeadline('');
                    setShowCalendar(false);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <Ionicons
                  name={showCalendar ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textMuted}
                />
              )}
            </TouchableOpacity>

            {showCalendar && (
              <InlineCalendar
                selectedDate={deadline}
                onSelectDate={(d) => {
                  setDeadline(d);
                  setShowCalendar(false);
                }}
                primaryColor={colors.primaryCyan}
                textPrimary={colors.textPrimary}
                textSecondary={colors.textSecondary}
                textMuted={colors.textMuted}
                surfaceBg={theme === 'dark' ? 'rgba(56, 189, 248, 0.05)' : '#F8FAFC'}
                borderColor={colors.glassBorder}
                language={language}
              />
            )}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { shadowColor: colors.accentGreen },
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={colors.gradients.green}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {initialName ? t.saveChangesBtn : t.createGoalBtn}
                </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderWidth: 1.2,
    borderBottomWidth: 0,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
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
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
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
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    borderRadius: 16,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    marginBottom: 14,
  },
  amountInput: {
    borderRadius: 18,
    fontSize: 24,
    fontWeight: '900',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    marginBottom: 14,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    marginBottom: 14,
    gap: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
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
