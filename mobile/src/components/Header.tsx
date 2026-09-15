import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { SmsNotificationModal } from './SmsNotificationModal';

interface HeaderProps {
  currentMonth: string;
  totalIncome?: number;
}

export const Header: React.FC<HeaderProps> = ({ currentMonth }) => {
  const { theme, toggleTheme, smsListenerEnabled, userProfile } = useFinanceStore();
  const colors = getTheme(theme, userProfile.primaryColor);
  const [smsModalVisible, setSmsModalVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Lado Esquerdo: Ações Rápidas em Cristal (Tema, SMS, Mês) */}
      <View style={styles.leftSection}>
        {/* Alternador de Modo Claro / Escuro */}
        <TouchableOpacity
          style={[
            styles.actionIconBtn,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              shadowColor: colors.crystalGlow,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons
            name={theme === 'light' ? 'moon-outline' : 'sunny-outline'}
            size={18}
            color={theme === 'light' ? colors.primaryCyan : colors.accentAmber}
          />
        </TouchableOpacity>

        {/* Botão de Notificações / SMS */}
        <TouchableOpacity
          style={[
            styles.actionIconBtn,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              shadowColor: colors.crystalGlow,
            },
          ]}
          onPress={() => setSmsModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="notifications-outline"
            size={18}
            color={smsListenerEnabled ? colors.primaryCyan : colors.textSecondary}
          />
          {smsListenerEnabled && (
            <View style={[styles.activeDot, { backgroundColor: colors.primaryCyan }]} />
          )}
        </TouchableOpacity>

        {/* Crachá do Mês em Cristal */}
        <View
          style={[
            styles.monthBadge,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
            {currentMonth}
          </Text>
        </View>
      </View>

      {/* Lado Superior Direito: Título da Marca com Logótipo Oficial em Cristal */}
      <View style={styles.rightSection}>
        <View style={styles.brandTitleRow}>
          <Image
            source={require('../../assets/splash-icon.png')}
            style={styles.brandLogoIcon}
            resizeMode="contain"
          />
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            Carterinha
          </Text>
        </View>
      </View>

      <SmsNotificationModal
        visible={smsModalVisible}
        onClose={() => setSmsModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  monthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  monthLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
});
