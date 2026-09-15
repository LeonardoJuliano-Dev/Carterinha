import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Modal,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFinanceStore } from './src/stores/financeStore';
import { startSyncQueueService } from './src/services/syncQueueService';
import { lightTheme, darkTheme, getTheme } from './src/theme/colors';
import { useTranslation } from './src/i18n/useTranslation';

// Telas Principais
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { LockScreen } from './src/screens/LockScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

// Telas Especializadas do Mockup
import { FixedExpensesScreen } from './src/screens/FixedExpensesScreen';
import { AdvisorScreen } from './src/screens/AdvisorScreen';
import { PriceComparisonScreen } from './src/screens/PriceComparisonScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { AppearanceScreen } from './src/screens/AppearanceScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';

// Modais Rápidos
import { TransactionModal } from './src/components/TransactionModal';
import { ReceiptScannerModal } from './src/components/ReceiptScannerModal';
import { GoalModal } from './src/components/GoalModal';

type MainTab = 'dashboard' | 'transactions' | 'goals' | 'settings';
type SubScreen = 'none' | 'fixed_expenses' | 'advisor' | 'price_comparison' | 'notifications' | 'appearance' | 'reports';

export default function App() {
  const {
    isInitialized,
    initialize,
    isSetupCompleted,
    isAppLocked,
    theme,
    userProfile,
    addTransaction,
    createGoal,
  } = useFinanceStore();

  const colors = getTheme(theme, userProfile.primaryColor);
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [subScreen, setSubScreen] = useState<SubScreen>('none');
  const [advisorInitialPrompt, setAdvisorInitialPrompt] = useState<string | undefined>(undefined);
  const [actionSheetVisible, setActionSheetVisible] = useState<boolean>(false);

  // Modais de Criação Rápida
  const [txModalVisible, setTxModalVisible] = useState<boolean>(false);
  const [scannerModalVisible, setScannerModalVisible] = useState<boolean>(false);
  const [goalModalVisible, setGoalModalVisible] = useState<boolean>(false);

  useEffect(() => {
    initialize();
    startSyncQueueService();
  }, []);

  // Gestão unificada e fluida do botão "Voltar" (Hardware Back do Android e gestos)
  useEffect(() => {
    const onBackPress = () => {
      // 1. Fechar modais secundários se estiverem visíveis
      if (actionSheetVisible) {
        setActionSheetVisible(false);
        return true;
      }
      if (txModalVisible) {
        setTxModalVisible(false);
        return true;
      }
      if (scannerModalVisible) {
        setScannerModalVisible(false);
        return true;
      }
      if (goalModalVisible) {
        setGoalModalVisible(false);
        return true;
      }

      // 2. Se estiver numa subtela especializada, regressa à tela anterior
      if (subScreen !== 'none') {
        setSubScreen('none');
        return true;
      }

      // 3. Se estiver em qualquer aba secundária (Transações, Metas, Definições), regressa ao Início (Dashboard)
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return true;
      }

      // 4. Se já estiver no Início sem sobreposições, permite fechar o app
      return false;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [
    actionSheetVisible,
    txModalVisible,
    scannerModalVisible,
    goalModalVisible,
    subScreen,
    activeTab,
  ]);

  if (!isInitialized) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
          backgroundColor={colors.background}
        />
        <ActivityIndicator size="large" color={colors.primaryCyan} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t.loadingCarterinha}
        </Text>
      </SafeAreaView>
    );
  }

  // Se o primeiro acesso ainda não foi concluído
  if (!isSetupCompleted) {
    return <OnboardingScreen />;
  }

  // Se o aplicativo estiver bloqueado por PIN de segurança
  if (isAppLocked) {
    return <LockScreen />;
  }

  const handleNotificationAction = (actionType?: string, actionPayload?: string) => {
    if (!actionType || actionType === 'none') return;
    if (actionType === 'navigate_advisor') {
      setAdvisorInitialPrompt(actionPayload);
      setSubScreen('advisor');
    } else if (actionType === 'navigate_goals') {
      setSubScreen('none');
      setActiveTab('goals');
    } else if (actionType === 'navigate_fixed_expenses') {
      setSubScreen('fixed_expenses');
    }
  };

  // Renderização de Subtelas
  if (subScreen === 'fixed_expenses') {
    return <FixedExpensesScreen onBack={() => setSubScreen('none')} />;
  }
  if (subScreen === 'advisor') {
    return (
      <AdvisorScreen
        onBack={() => {
          setSubScreen('none');
          setAdvisorInitialPrompt(undefined);
        }}
        initialPrompt={advisorInitialPrompt}
      />
    );
  }
  if (subScreen === 'price_comparison') {
    return (
      <PriceComparisonScreen
        onBack={() => setSubScreen('none')}
        onNavigateScanner={() => setScannerModalVisible(true)}
      />
    );
  }
  if (subScreen === 'notifications') {
    return (
      <NotificationsScreen
        onBack={() => setSubScreen('none')}
        onActionClick={handleNotificationAction}
      />
    );
  }
  if (subScreen === 'appearance') {
    return <AppearanceScreen onBack={() => setSubScreen('none')} />;
  }
  if (subScreen === 'reports') {
    return <ReportsScreen onBack={() => setSubScreen('none')} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      {/* Conteúdo da Aba Ativa */}
      <View style={styles.content}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            onNavigateTransactions={() => setActiveTab('transactions')}
            onNavigateGoals={() => setActiveTab('goals')}
            onNavigateFixedExpenses={() => setSubScreen('fixed_expenses')}
            onActionClick={handleNotificationAction}
            onNavigateAdvisorWithPrompt={(prompt) => {
              setAdvisorInitialPrompt(prompt);
              setSubScreen('advisor');
            }}
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionsScreen onBack={() => setActiveTab('dashboard')} />
        )}
        {activeTab === 'goals' && (
          <GoalsScreen
            onBack={() => setActiveTab('dashboard')}
            onNavigateAdvisor={() => setSubScreen('advisor')}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen
            onBack={() => setActiveTab('dashboard')}
            onNavigateAppearance={() => setSubScreen('appearance')}
            onNavigateFixedExpenses={() => setSubScreen('fixed_expenses')}
            onNavigateAdvisor={() => setSubScreen('advisor')}
            onNavigateNotifications={() => setSubScreen('notifications')}
            onNavigatePriceComparison={() => setSubScreen('price_comparison')}
          />
        )}
      </View>

      {/* Barra de Navegação Flutuante One UI 8.5 com 5 Elementos e Botão Central (+) em Cristal */}
      <View
        style={[
          styles.floatingNav,
          {
            backgroundColor: colors.floatingNavBg,
            borderColor: colors.floatingNavBorder,
            shadowColor: colors.crystalGlow,
          },
        ]}
      >
        {/* Aba 1: Início */}
        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'dashboard' && { backgroundColor: colors.activeNavBg, borderRadius: 20 },
          ]}
          onPress={() => {
            setSubScreen('none');
            setActiveTab('dashboard');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'dashboard' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'dashboard' ? colors.primaryCyan : colors.textMuted}
          />
          <Text
            style={[
              styles.navLabel,
              {
                color: activeTab === 'dashboard' ? colors.primaryCyan : colors.textSecondary,
                fontWeight: activeTab === 'dashboard' ? '800' : '600',
              },
            ]}
          >
            {t.navDashboard}
          </Text>
        </TouchableOpacity>

        {/* Aba 2: Transações */}
        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'transactions' && { backgroundColor: colors.activeNavBg, borderRadius: 20 },
          ]}
          onPress={() => {
            setSubScreen('none');
            setActiveTab('transactions');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'transactions' ? 'receipt' : 'receipt-outline'}
            size={22}
            color={activeTab === 'transactions' ? colors.primaryCyan : colors.textMuted}
          />
          <Text
            style={[
              styles.navLabel,
              {
                color: activeTab === 'transactions' ? colors.primaryCyan : colors.textSecondary,
                fontWeight: activeTab === 'transactions' ? '800' : '600',
              },
            ]}
          >
            {t.navFixedExpenses}
          </Text>
        </TouchableOpacity>

        {/* Botão Central Elevado (+) com Gradiente de Cristal Radiante */}
        <TouchableOpacity
          style={[
            styles.centerPlusButton,
            { shadowColor: colors.primaryCyan },
          ]}
          onPress={() => setActionSheetVisible(true)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={colors.gradients.cyan}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerPlusGradient}
          >
            <Ionicons name="add" size={30} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Aba 4: Metas */}
        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'goals' && { backgroundColor: colors.activeNavBg, borderRadius: 20 },
          ]}
          onPress={() => {
            setSubScreen('none');
            setActiveTab('goals');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'goals' ? 'flag' : 'flag-outline'}
            size={22}
            color={activeTab === 'goals' ? colors.primaryCyan : colors.textMuted}
          />
          <Text
            style={[
              styles.navLabel,
              {
                color: activeTab === 'goals' ? colors.primaryCyan : colors.textSecondary,
                fontWeight: activeTab === 'goals' ? '800' : '600',
              },
            ]}
          >
            {t.navGoals}
          </Text>
        </TouchableOpacity>

        {/* Aba 5: Mais */}
        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'settings' && { backgroundColor: colors.activeNavBg, borderRadius: 20 },
          ]}
          onPress={() => {
            setSubScreen('none');
            setActiveTab('settings');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'grid' : 'grid-outline'}
            size={22}
            color={activeTab === 'settings' ? colors.primaryCyan : colors.textMuted}
          />
          <Text
            style={[
              styles.navLabel,
              {
                color: activeTab === 'settings' ? colors.primaryCyan : colors.textSecondary,
                fontWeight: activeTab === 'settings' ? '800' : '600',
              },
            ]}
          >
            {t.navSettings}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Sheet Rápida ao Clicar no (+) Central */}
      <Modal
        visible={actionSheetVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setActionSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActionSheetVisible(false)}
        >
          <View
            style={[
              styles.actionSheetCard,
              {
                backgroundColor: colors.glassSurfaceElevated,
                borderColor: colors.glassBorder,
                borderTopColor: colors.glassBorderTop,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.primaryCyanLight }]} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{t.quickActions}</Text>

            <View style={styles.quickGrid}>
              <TouchableOpacity
                style={[
                  styles.quickItem,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                  },
                ]}
                onPress={() => {
                  setActionSheetVisible(false);
                  setTxModalVisible(true);
                }}
              >
                <View style={[styles.quickIconBox, { backgroundColor: colors.primaryCyanLight, borderColor: 'rgba(0, 229, 255, 0.3)' }]}>
                  <Ionicons name="card" size={22} color={colors.primaryCyan} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>{t.newExpense}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickItem,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                  },
                ]}
                onPress={() => {
                  setActionSheetVisible(false);
                  setScannerModalVisible(true);
                }}
              >
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(5, 150, 105, 0.16)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                  <Ionicons name="camera" size={22} color={colors.accentGreen} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>{t.scanReceipt}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickItem,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                  },
                ]}
                onPress={() => {
                  setActionSheetVisible(false);
                  setGoalModalVisible(true);
                }}
              >
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(147, 51, 234, 0.16)', borderColor: 'rgba(168, 85, 247, 0.3)' }]}>
                  <Ionicons name="flag" size={22} color={colors.accentPurple} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>{t.newGoal}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickItem,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                  },
                ]}
                onPress={() => {
                  setActionSheetVisible(false);
                  setSubScreen('price_comparison');
                }}
              >
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.16)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                  <Ionicons name="pricetags" size={22} color={colors.accentAmber} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>{t.priceComparison}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickItem,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                  },
                ]}
                onPress={() => {
                  setActionSheetVisible(false);
                  setSubScreen('notifications');
                }}
              >
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(225, 29, 72, 0.16)', borderColor: 'rgba(244, 63, 94, 0.3)' }]}>
                  <Ionicons name="notifications" size={22} color={colors.accentRed} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>{t.smsBanks}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickItem,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                  },
                ]}
                onPress={() => {
                  setActionSheetVisible(false);
                  setSubScreen('advisor');
                }}
              >
                <View style={[styles.quickIconBox, { backgroundColor: colors.primaryCyanLight, borderColor: 'rgba(0, 229, 255, 0.3)' }]}>
                  <Ionicons name="sparkles" size={22} color={colors.primaryCyan} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>{t.navAiAdvisor}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modais Globais de Registo */}
      <TransactionModal
        visible={txModalVisible}
        onClose={() => setTxModalVisible(false)}
        onSubmit={async (desc, amount, isEssential, cat, store, items) => {
          await addTransaction(desc, amount, isEssential, cat, undefined, store, items);
        }}
      />

      <ReceiptScannerModal
        visible={scannerModalVisible}
        onClose={() => setScannerModalVisible(false)}
        onExtracted={() => setTxModalVisible(true)}
      />

      <GoalModal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        onSubmit={async (name, target, deadline) => {
          await createGoal(name, target, deadline);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  floatingNav: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    right: 14,
    flexDirection: 'row',
    borderRadius: 34,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  centerPlusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 12,
  },
  centerPlusGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  navLabel: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: -0.2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  actionSheetCard: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 38,
    borderWidth: 1,
  },
  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 20,
    textAlign: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickItem: {
    width: '30.5%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderTopWidth: 1.5,
  },
  quickIconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
});
