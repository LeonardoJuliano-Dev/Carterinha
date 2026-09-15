import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../theme/colors';
import { useFinanceStore } from '../stores/financeStore';
import { useTranslation } from '../i18n/useTranslation';

interface MonthSelectorModalProps {
  visible: boolean;
  selectedMonthYear: string; // 'YYYY-MM'
  onSelectMonth: (monthYear: string) => void;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const MonthSelectorModal: React.FC<MonthSelectorModalProps> = ({
  visible,
  selectedMonthYear,
  onSelectMonth,
  onClose,
  theme,
}) => {
  const { t, language } = useTranslation();
  const { theme: storeTheme, userProfile } = useFinanceStore();
  const activeTheme = theme || storeTheme;
  const colors = getTheme(activeTheme, userProfile.primaryColor);

  const dateLocale = language === 'en' ? 'en-US' : 'pt-PT';

  // Gera os meses a partir do mês de início de utilização (startMonthYear) até ao mês atual
  const generateMonthsList = () => {
    const list: Array<{ key: string; label: string; isCurrent: boolean }> = [];
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Mês em que começou o uso da aplicação
    const startStr = userProfile.startMonthYear || currentKey;
    const [startYearStr, startMonthStr] = startStr.split('-');
    const startYear = parseInt(startYearStr, 10) || now.getFullYear();
    const startMonth = (parseInt(startMonthStr, 10) || (now.getMonth() + 1)) - 1; // 0-indexed

    const startDate = new Date(startYear, startMonth, 1);
    let targetEndDate = new Date(now.getFullYear(), now.getMonth(), 1);

    if (selectedMonthYear) {
      const [selY, selM] = selectedMonthYear.split('-');
      const selDate = new Date(parseInt(selY, 10), (parseInt(selM, 10) || 1) - 1, 1);
      if (selDate > targetEndDate) {
        targetEndDate = selDate;
      }
    }

    let iter = new Date(targetEndDate.getFullYear(), targetEndDate.getMonth(), 1);
    while (iter >= startDate) {
      const key = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, '0')}`;
      const rawName = iter.toLocaleDateString(dateLocale, { month: 'long' });
      const label = `${rawName.charAt(0).toUpperCase() + rawName.slice(1)} ${iter.getFullYear()}`;
      list.push({
        key,
        label,
        isCurrent: key === currentKey,
      });
      iter = new Date(iter.getFullYear(), iter.getMonth() - 1, 1);
    }

    if (list.length === 0) {
      const rawName = now.toLocaleDateString(dateLocale, { month: 'long' });
      list.push({
        key: currentKey,
        label: `${rawName.charAt(0).toUpperCase() + rawName.slice(1)} ${now.getFullYear()}`,
        isCurrent: true,
      });
    }

    return list;
  };

  const months = generateMonthsList();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.content,
                {
                  backgroundColor: colors.glassSurfaceElevated,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
            >
              {/* Header do Modal */}
              <View style={styles.header}>
                <View style={styles.handle} />
                <View style={styles.titleRow}>
                  <View style={styles.titleLeft}>
                    <Ionicons name="calendar-outline" size={20} color={colors.primaryCyan} />
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                      {t.selectMonthTitle}
                    </Text>
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
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t.selectMonthSubtitle}
                </Text>
              </View>

              {/* Lista de Meses */}
              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              >
                {months.map((m) => {
                  const isSelected = m.key === selectedMonthYear;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      style={[
                        styles.monthItem,
                        {
                          backgroundColor: isSelected
                            ? 'rgba(2, 132, 199, 0.18)'
                            : colors.glassSurface,
                          borderColor: isSelected ? colors.primaryCyan : colors.glassBorder,
                          borderTopColor: isSelected ? colors.primaryCyan : colors.glassBorderTop,
                        },
                      ]}
                      onPress={() => {
                        onSelectMonth(m.key);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.monthItemLeft}>
                        <View
                          style={[
                            styles.radioDot,
                            {
                              borderColor: isSelected ? colors.primaryCyan : colors.textMuted,
                              backgroundColor: isSelected ? colors.primaryCyan : 'transparent',
                            },
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.monthLabel,
                            {
                              color: isSelected ? colors.primaryCyan : colors.textPrimary,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {m.label}
                        </Text>
                      </View>

                      {m.isCurrent && (
                        <View
                          style={[
                            styles.currentBadge,
                            { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
                          ]}
                        >
                          <Text style={[styles.currentBadgeText, { color: colors.accentGreen }]}>
                            {t.currentMonthBadge}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '75%',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  list: {
    maxHeight: 380,
  },
  listContent: {
    gap: 8,
    paddingBottom: 20,
  },
  monthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  monthItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 14,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
