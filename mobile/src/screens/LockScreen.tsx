import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { useTranslation } from '../i18n/useTranslation';

const SUB_LETTERS: { [key: string]: string } = {
  '1': '',
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
  '0': '+',
};

export const LockScreen: React.FC = () => {
  const {
    theme,
    userProfile,
    unlockApp,
    unlockWithBiometrics,
    resetDatabaseToZero,
  } = useFinanceStore();

  const { t, language } = useTranslation();
  const colors = getTheme(theme, userProfile.primaryColor);

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricTypeLabel, setBiometricTypeLabel] = useState<string>(t.biometricFingerprint);
  const [isAuthenticatingBio, setIsAuthenticatingBio] = useState<boolean>(false);

  // 1. Verificar suporte a biometria no hardware do telemóvel
  const checkBiometrics = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        setBiometricAvailable(true);

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricTypeLabel(t.biometricFaceId);
        } else {
          setBiometricTypeLabel(t.biometricFingerprint);
        }

        // Tentar autenticação biométrica imediata ao abrir o ecrã
        triggerBiometricAuth();
      }
    } catch (err) {
      console.log('[LockScreen] Biometria não disponível neste dispositivo/ambiente:', err);
    }
  }, []);

  useEffect(() => {
    checkBiometrics();
  }, [checkBiometrics]);

  // 2. Acionar diálogo nativo de impressão digital do Android/iOS
  const triggerBiometricAuth = async () => {
    if (isAuthenticatingBio) return;
    setIsAuthenticatingBio(true);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t.unlockPrompt,
        cancelLabel: t.usePin,
        disableDeviceFallback: true,
      });

      if (result.success) {
        Vibration.vibrate(50);
        unlockWithBiometrics();
      }
    } catch (err) {
      console.warn('[LockScreen] Falha na leitura biométrica:', err);
    } finally {
      setIsAuthenticatingBio(false);
    }
  };

  // 3. Introdução de Dígitos do PIN
  const handlePressDigit = async (digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setHasError(false);

      if (nextPin.length === 4) {
        setTimeout(async () => {
          const success = await unlockApp(nextPin);
          if (!success) {
            setHasError(true);
            setEnteredPin('');
            Vibration.vibrate([0, 80, 50, 80]);
          } else {
            Vibration.vibrate(40);
          }
        }, 120);
      }
    }
  };

  const handleBackspace = () => {
    if (enteredPin.length > 0) {
      setEnteredPin(enteredPin.slice(0, -1));
      setHasError(false);
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      t.resetAppTitle,
      t.resetAppDesc,
      [
        { text: t.cancelReset, style: 'cancel' },
        {
          text: t.yesResetAll,
          style: 'destructive',
          onPress: async () => {
            await resetDatabaseToZero();
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    const parts = (name || 'Utilizador').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || 'CT';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Luz ambiente de fundo em gradiente de cristal */}
      <View style={styles.ambientGlowTop} pointerEvents="none">
        <LinearGradient
          colors={['rgba(2, 132, 199, 0.18)', 'transparent']}
          style={styles.ambientGlowGrad}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Top Bar com Identidade da Marca & Cofre */}
      <View style={styles.brandBar}>
        <View style={styles.brandLeft}>
          <Image
            source={require('../../assets/splash-icon.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.brandName, { color: colors.textPrimary }]}>Carterinha</Text>
            <Text style={[styles.vaultTag, { color: colors.primaryCyan }]}>{t.encryptedVault}</Text>
          </View>
        </View>

        <View
          style={[
            styles.secureBadge,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <Ionicons name="shield-checkmark" size={14} color={colors.accentGreen} />
          <Text style={[styles.secureBadgeText, { color: colors.textSecondary }]}>{t.localFirstBadge}</Text>
        </View>
      </View>

      {/* Secção Central: Avatar, Nome e Indicador de PIN */}
      <View style={styles.centerSection}>
        {/* Avatar com Anel Radiante de Cristal */}
        <View style={[styles.avatarHalo, { shadowColor: colors.primaryCyan }]}>
          <LinearGradient
            colors={colors.gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{getInitials(userProfile.name)}</Text>
          </LinearGradient>
        </View>

        <Text style={[styles.userName, { color: colors.textPrimary }]}>
          {userProfile.name || t.welcomeUser}
        </Text>
        <Text style={[styles.userStatus, { color: colors.textSecondary }]}>
          {biometricAvailable
            ? t.touchSensorOrPin
            : t.enterPin}
        </Text>

        {/* Mensagem de Estado / Erro */}
        <View style={styles.statusMsgRow}>
          {hasError ? (
            <View style={styles.errorRow}>
              <Ionicons name="close-circle" size={16} color={colors.accentRed} />
              <Text style={[styles.errorText, { color: colors.accentRed }]}>
                {t.invalidPin}
              </Text>
            </View>
          ) : (
            <View style={styles.hintRow}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                {t.lockTitle}
              </Text>
            </View>
          )}
        </View>

        {/* Cápsula de Cristal com os 4 Pontos de PIN */}
        <View
          style={[
            styles.pinCapsule,
            {
              backgroundColor: colors.glassSurfaceElevated,
              borderColor: hasError ? colors.accentRed : colors.glassBorder,
              shadowColor: hasError ? colors.accentRed : colors.primaryCyan,
            },
          ]}
        >
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = enteredPin.length > idx;
            return (
              <View key={idx} style={styles.pinDotWrapper}>
                {isFilled ? (
                  <LinearGradient
                    colors={hasError ? colors.gradients.red : colors.gradients.cyan}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.pinDotFilled}
                  />
                ) : (
                  <View
                    style={[
                      styles.pinDotEmpty,
                      {
                        backgroundColor: colors.glassInputBg,
                        borderColor: colors.glassBorder,
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Teclado Numérico One UI 8.5 em Cristal */}
      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ].map((row, rIdx) => (
          <View key={rIdx} style={styles.keypadRow}>
            {row.map((digit) => (
              <TouchableOpacity
                key={digit}
                style={[
                  styles.keyButton,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                    shadowColor: colors.cardShadow,
                  },
                ]}
                onPress={() => handlePressDigit(digit)}
                activeOpacity={0.7}
              >
                <Text style={[styles.keyDigit, { color: colors.textPrimary }]}>{digit}</Text>
                {SUB_LETTERS[digit] ? (
                  <Text style={[styles.keySubLetters, { color: colors.textMuted }]}>
                    {SUB_LETTERS[digit]}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Linha Inferior: Biometria, Dígito 0 e Backspace */}
        <View style={styles.keypadRow}>
          {/* Botão de Biometria / Leitor de Impressão Digital */}
          <TouchableOpacity
            style={[
              styles.keyButtonSpecial,
              {
                backgroundColor: '#FFFFFF',
                borderColor: '#0284C7',
                borderWidth: 2,
                shadowColor: '#0284C7',
              },
            ]}
            onPress={triggerBiometricAuth}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t.authWithBiometrics}
          >
            <MaterialCommunityIcons
              name="fingerprint"
              size={36}
              color="#0284C7"
            />
            <Text style={[styles.keySpecialLabel, { color: '#0284C7' }]}>
              {t.digitalLabel}
            </Text>
          </TouchableOpacity>

          {/* Dígito 0 */}
          <TouchableOpacity
            style={[
              styles.keyButton,
              {
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
                shadowColor: colors.cardShadow,
              },
            ]}
            onPress={() => handlePressDigit('0')}
            activeOpacity={0.7}
          >
            <Text style={[styles.keyDigit, { color: colors.textPrimary }]}>0</Text>
            <Text style={[styles.keySubLetters, { color: colors.textMuted }]}>+</Text>
          </TouchableOpacity>

          {/* Botão Backspace */}
          <TouchableOpacity
            style={[
              styles.keyButtonSpecial,
              {
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
                shadowColor: colors.cardShadow,
              },
            ]}
            onPress={handleBackspace}
            onLongPress={() => setEnteredPin('')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t.eraseDigit}
          >
            <Ionicons name="backspace-outline" size={26} color={colors.textSecondary} />
            <Text style={[styles.keySpecialLabel, { color: colors.textMuted }]}>{t.eraseLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rodapé: Repor aplicação / Esqueceu o PIN */}
      <TouchableOpacity
        style={styles.forgotPinBtn}
        onPress={handleResetApp}
        activeOpacity={0.7}
      >
        <Ionicons name="key-outline" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
        <Text style={[styles.forgotPinText, { color: colors.textMuted }]}>
          {t.forgotPinLabel} <Text style={{ color: colors.accentRed, fontWeight: '800' }}>{t.resetDataAction}</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
    paddingBottom: 20,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  ambientGlowGrad: {
    width: '100%',
    height: '100%',
  },
  brandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  vaultTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  secureBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  centerSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  avatarHalo: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 3,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 14,
  },
  avatarGradient: {
    flex: 1,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  userStatus: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statusMsgRow: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '800',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pinCapsule: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1.2,
    marginTop: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  pinDotWrapper: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDotFilled: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  pinDotEmpty: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  keypad: {
    paddingBottom: 6,
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  keyButton: {
    width: 78,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  keyDigit: {
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 32,
  },
  keySubLetters: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: -2,
  },
  keyButtonSpecial: {
    width: 78,
    height: 72,
    borderRadius: 24,
    borderWidth: 1.8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  keySpecialLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  forgotPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  forgotPinText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
