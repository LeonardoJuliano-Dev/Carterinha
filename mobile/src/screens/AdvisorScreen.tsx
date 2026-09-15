import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFinanceStore } from '../stores/financeStore';
import { fetchUserBehaviorMLProfile, sendAdvisorChatMessage } from '../services/api';
import { UserBehaviorProfile, Goal } from '../types';
import { GoalModal } from '../components/GoalModal';
import { GoalHistoryModal } from '../components/GoalHistoryModal';
import { lightTheme, darkTheme, getTheme } from '../theme/colors';
import { useTranslation } from '../i18n/useTranslation';

interface AdvisorScreenProps {
  onBack?: () => void;
  initialPrompt?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  suggestGoalCreation?: boolean;
  suggestedGoalName?: string | null;
  suggestedGoalTarget?: number | null;
  actionPlan?: string[];
  expensesToCut?: string[];
  respondedToAction?: boolean;
}

const CHAT_STORAGE_KEY = '@carterinhas_advisor_chat_messages';

const QUICK_PROMPTS = [
  {
    icon: 'pie-chart-outline' as const,
    label: 'Meu Orçamento',
    text: 'Analisa o meu orçamento mensal de acordo com a minha divisão personalizada. Está equilibrado com a minha renda e despesas?',
  },
  {
    icon: 'trending-down-outline' as const,
    label: 'Maior despesa',
    text: 'Qual foi a minha maior categoria de despesa recentemente e quanto gastei?',
  },
  {
    icon: 'cut-outline' as const,
    label: 'Onde cortar?',
    text: 'Com base no meu histórico de gastos, onde posso cortar despesas para poupar mais?',
  },
  {
    icon: 'flag-outline' as const,
    label: 'Rever metas',
    text: 'Faz uma avaliação geral do progresso de todas as minhas metas ativas.',
  },
  {
    icon: 'trending-up-outline' as const,
    label: 'Saúde financeira',
    text: 'Dá-me um resumo geral da minha saúde financeira e capacidade de poupança.',
  },
];

export const AdvisorScreen: React.FC<AdvisorScreenProps> = ({ onBack, initialPrompt }) => {
  const { t, currencySymbol, language } = useTranslation();
  const {
    budgets,
    goals,
    transactions,
    userProfile,
    allocation,
    budgetSplit,
    isBackendReachable,
    createGoal,
    refreshData,
    getAvailableBalance,
    theme,
  } = useFinanceStore();

  const colors = getTheme(theme, userProfile.primaryColor);
  const scrollViewRef = useRef<ScrollView>(null);
  const isChatLoadedRef = useRef(false);

  const [activeSubTab, setActiveSubTab] = useState<'advisor' | 'behavior_ml'>('advisor');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mlProfile, setMlProfile] = useState<UserBehaviorProfile | null>(null);
  const [loadingML, setLoadingML] = useState(false);

  // Modal de cadastro de meta a partir do chat
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [pendingGoalName, setPendingGoalName] = useState('');
  const [pendingGoalTarget, setPendingGoalTarget] = useState<number | undefined>(undefined);

  // Modal de histórico da meta selecionada
  const [selectedGoalForHistory, setSelectedGoalForHistory] = useState<Goal | null>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Mapa de gastos reais agregados por categoria
  const recentSpendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      const cat = tx.category || 'Outros';
      map[cat] = (map[cat] || 0) + tx.amount;
    });
    return map;
  }, [transactions]);

  // Mensagem simples, bonita e elegante terminando com 'Como posso ajudar hoje?'
  const buildWelcomeMessage = (): ChatMessage => {
    const userName = userProfile.name ? userProfile.name.split(' ')[0] : 'amigo';
    return {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Olá, ${userName}! Sou o teu Consultor Financeiro. Como posso ajudar hoje?`,
      time: 'Hoje',
    };
  };

  useEffect(() => {
    loadMLProfile();

    // Carrega o histórico persistente do chat
    const initChatHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        if (saved) {
          const parsed: ChatMessage[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            isChatLoadedRef.current = true;
            return;
          }
        }
      } catch (err) {
        console.warn('[AdvisorChat] Falha ao ler histórico:', err);
      }
      setMessages([buildWelcomeMessage()]);
      isChatLoadedRef.current = true;
    };

    initChatHistory();
  }, []);

  // Guarda automaticamente qualquer alteração nas mensagens no AsyncStorage
  useEffect(() => {
    if (isChatLoadedRef.current && messages.length > 0) {
      AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)).catch((err) => {
        console.warn('[AdvisorChat] Falha ao guardar histórico:', err);
      });
    }
  }, [messages]);

  const loadMLProfile = async () => {
    setLoadingML(true);
    try {
      const profile = await fetchUserBehaviorMLProfile({
        userName: userProfile.name,
        monthlyIncome: allocation?.total_income || 0,
        currentBalance: getAvailableBalance(),
        transactions: transactions,
        activeGoals: goals,
        budgetSplit: budgetSplit,
      });
      setMlProfile(profile);
    } catch {
      // Usa fallback silencioso
    } finally {
      setLoadingML(false);
    }
  };

  const handleSendMessage = async (textToSend?: string, initialMessagesList?: ChatMessage[]) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;
    if (!textToSend) setChatInput('');

    const newMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      time: 'Agora',
    };

    if (!initialMessagesList) {
      setMessages((prev) => [...prev, newMsg]);
    }
    setLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const currentBase = initialMessagesList || messages;
      const history = currentBase.slice(-6).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));

      const aiRes = await sendAdvisorChatMessage({
        message: text,
        userName: userProfile.name,
        activeGoals: goals,
        budgetSplit: budgetSplit,
        monthlyIncome: allocation?.total_income,
        currentBalance: getAvailableBalance(),
        recentSpendingByCategory: recentSpendingByCategory,
        conversationHistory: history,
      });

      const aiReply: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiRes.reply,
        time: 'Agora',
        suggestGoalCreation: aiRes.suggest_goal_creation,
        suggestedGoalName: aiRes.suggested_goal_name,
        suggestedGoalTarget: aiRes.suggested_goal_target,
        actionPlan: aiRes.action_plan,
        expensesToCut: aiRes.expenses_to_cut,
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: 'Com base no teu orçamento e metas, recomendo equilibrar os gastos não essenciais para libertar margem para os teus objetivos.',
          time: 'Agora',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const initialPromptSentRef = useRef(false);
  useEffect(() => {
    if (initialPrompt && !initialPromptSentRef.current && isChatLoadedRef.current) {
      initialPromptSentRef.current = true;
      const timer = setTimeout(() => {
        handleSendMessage(initialPrompt.trim());
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt]);

  // Abre o GoalModal pré-preenchido quando o utilizador toca em "Sim, cadastrar meta"
  const handleOpenGoalModalFromChat = (name?: string | null, target?: number | null) => {
    setPendingGoalName(name || '');
    setPendingGoalTarget(target && target > 0 ? target : undefined);
    setGoalModalVisible(true);
  };

  // Submissão do GoalModal acionado via Chat
  const handleCreateGoalFromChat = async (name: string, targetAmount: number, deadline?: string) => {
    try {
      await createGoal(name, targetAmount, deadline);
      await refreshData();
      setGoalModalVisible(false);

      // Marca mensagens anteriores com botões como respondidas
      setMessages((prev) =>
        prev.map((m) => (m.suggestGoalCreation ? { ...m, respondedToAction: true } : m))
      );

      const confirmUserMsg: ChatMessage = {
        id: `user_confirm_${Date.now()}`,
        sender: 'user',
        text: `Sim! Já cadastrei a meta "${name}" no valor de ${targetAmount.toLocaleString('pt-PT')} MT.`,
        time: 'Agora',
      };
      setMessages((prev) => [...prev, confirmUserMsg]);
      setLoading(true);

      const aiRes = await sendAdvisorChatMessage({
        message: `Acabei de cadastrar a meta "${name}" de ${targetAmount} MT com prazo ${deadline || 'a definir'}. Diz-me exatamente como conseguir e quais gastos cortar de seguida para montar o plano.`,
        userName: userProfile.name,
        activeGoals: goals,
        budgetSplit: budgetSplit,
        monthlyIncome: allocation?.total_income,
        currentBalance: getAvailableBalance(),
        recentSpendingByCategory: recentSpendingByCategory,
        justCreatedGoal: {
          name,
          target_amount: targetAmount,
          deadline,
        },
      });

      const aiReply: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiRes.reply,
        time: 'Agora',
        actionPlan: aiRes.action_plan,
        expensesToCut: aiRes.expenses_to_cut,
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch {
      Alert.alert('Erro', 'Não foi possível cadastrar a meta.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Quando o utilizador toca em "Não agora"
  const handleRejectGoalFromChat = async (name?: string | null, target?: number | null) => {
    setMessages((prev) =>
      prev.map((m) => (m.suggestGoalCreation ? { ...m, respondedToAction: true } : m))
    );

    const targetStr = target ? ` de ${target.toLocaleString('pt-PT')} MT` : '';
    const userMsg: ChatMessage = {
      id: `user_reject_${Date.now()}`,
      sender: 'user',
      text: `Não quero cadastrar a meta${targetStr} agora. Ajuda-me apenas a montar o plano de como conseguir e quais gastos cortar.`,
      time: 'Agora',
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const aiRes = await sendAdvisorChatMessage({
        message: `Não quero cadastrar a meta ${name || ''}${targetStr} agora. Ajuda-me apenas a montar um plano de como conseguir atingir este objetivo e quais gastos cortar. No final sugere que cadastre a meta.`,
        userName: userProfile.name,
        activeGoals: goals,
        budgetSplit: budgetSplit,
        monthlyIncome: allocation?.total_income,
        currentBalance: getAvailableBalance(),
        recentSpendingByCategory: recentSpendingByCategory,
      });

      const aiReply: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiRes.reply,
        time: 'Agora',
        actionPlan: aiRes.action_plan,
        expensesToCut: aiRes.expenses_to_cut,
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: 'Compreendo perfeitamente! Podes focar-te em reservar uma quantia mensal constante e cortar gastos supérfluos. Quando quiseres ver gráficos de evolução e lembretes, basta cadastrar a meta no Carterinha!',
          time: 'Agora',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Limpa o histórico de mensagens localmente e no AsyncStorage com confirmação
  const handleConfirmClearChat = () => {
    Alert.alert(
      'Limpar Conversa',
      'Tens a certeza de que desejas apagar todo o histórico de mensagens deste consultor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
              setMessages([buildWelcomeMessage()]);
            } catch (err) {
              console.warn('[AdvisorChat] Erro ao limpar histórico:', err);
            }
          },
        },
      ]
    );
  };

  // Abre o modal de histórico da meta ao clicar no cartão
  const handleOpenGoalHistory = (goal: Goal) => {
    setSelectedGoalForHistory(goal);
    setHistoryModalVisible(true);
  };

  // Limpa o chat anterior e inicia um chat dedicado exclusivamente a esta meta
  const handleConsultGoalDedicated = async (goal: Goal) => {
    try {
      await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (err) {
      console.warn('[AdvisorChat] Erro ao limpar histórico anterior:', err);
    }

    const questionText = `Quero consultar a minha meta "${goal.name}". Como está o meu progresso atual e qual é o plano prático com cortes de despesas para a atingir?`;

    const dedicatedMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: questionText,
      time: 'Agora',
    };

    setMessages([dedicatedMsg]);
    handleSendMessage(questionText, [dedicatedMsg]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar One UI 8.5 Dark */}
      <View style={[styles.topBar, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>{t.advisorTitle}</Text>
          <Text style={{ fontSize: 11, color: isBackendReachable ? colors.accentGreen : colors.accentAmber, fontWeight: '600' }}>
            {isBackendReachable ? `● ${t.onlineMlStatus}` : `● ${t.offlineAiStatus}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={() => {
              refreshData();
              loadMLProfile();
            }}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={handleConfirmClearChat}
          >
            <Ionicons name="trash-outline" size={18} color={colors.accentRed} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Seletor de Modo: Consultor vs Perfil Machine Learning em Cristal */}
      <View style={[styles.modeTabs, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderTopColor: colors.glassBorderTop }]}>
        <TouchableOpacity
          style={[
            styles.modeTabBtn,
            activeSubTab === 'advisor' && { backgroundColor: colors.primaryCyan, shadowColor: colors.primaryCyan },
          ]}
          onPress={() => setActiveSubTab('advisor')}
        >
          <Text
            style={[
              styles.modeTabText,
              { color: activeSubTab === 'advisor' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Consultor & Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeTabBtn,
            activeSubTab === 'behavior_ml' && { backgroundColor: colors.primaryCyan, shadowColor: colors.primaryCyan },
          ]}
          onPress={() => setActiveSubTab('behavior_ml')}
        >
          <Text
            style={[
              styles.modeTabText,
              { color: activeSubTab === 'behavior_ml' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Perfil Machine Learning
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeSubTab === 'advisor' ? (
          <>
            {/* Secção de Múltiplas Metas Ativas com Carrossel */}
            <View style={styles.goalsSectionContainer}>
              <View style={styles.goalsSectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="flag" size={16} color={colors.primaryCyan} />
                  <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>
                    As Tuas Metas ({goals.length})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleOpenGoalModalFromChat()}
                  style={[styles.addGoalSmallBtn, { backgroundColor: colors.primaryCyanLight }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={14} color={colors.primaryCyan} />
                  <Text style={[styles.addGoalSmallBtnText, { color: colors.primaryCyan }]}>Nova Meta</Text>
                </TouchableOpacity>
              </View>

              {goals.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.goalsScrollContainer}
                >
                  {goals.map((g) => {
                    const rem = Math.max(0, g.target_amount - g.current_amount);
                    const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
                    return (
                      <TouchableOpacity
                        key={g.id}
                        style={[styles.horizontalGoalCard, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderTopColor: colors.glassBorderTop }]}
                        onPress={() => handleOpenGoalHistory(g)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.goalCardHeaderRow}>
                          <Text style={[styles.goalCardName, { color: colors.textPrimary }]} numberOfLines={1}>
                            {g.name}
                          </Text>
                          <View style={[styles.goalCardPctBadge, { backgroundColor: colors.primaryCyanLight }]}>
                            <Text style={[styles.goalCardPctText, { color: colors.primaryCyan }]}>{pct}%</Text>
                          </View>
                        </View>

                        <View style={[styles.progressBarTrack, { backgroundColor: colors.inputBg, marginVertical: 8 }]}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                backgroundColor: pct >= 100 ? colors.accentGreen : colors.primaryCyan,
                                width: `${pct}%`,
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.goalCardAmountsRow}>
                          <Text style={[styles.goalCardAmountMuted, { color: colors.textMuted }]}>
                            Guardado: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{g.current_amount.toLocaleString('pt-PT')} MT</Text>
                          </Text>
                          <Text style={[styles.goalCardAmountMuted, { color: colors.textMuted }]}>
                            Falta: <Text style={{ color: colors.accentAmber, fontWeight: '700' }}>{rem.toLocaleString('pt-PT')} MT</Text>
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[styles.askAboutGoalBtn, { backgroundColor: colors.glassSurfaceElevated, borderColor: colors.glassBorder, borderTopColor: colors.glassBorderTop }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleConsultGoalDedicated(g);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.primaryCyan} />
                          <Text style={[styles.askAboutGoalBtnText, { color: colors.primaryCyan }]}>Consultar esta meta</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={[styles.noGoalsCard, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderTopColor: colors.glassBorderTop }]}>
                  <Ionicons name="flag-outline" size={24} color={colors.accentAmber} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.noGoalsTitle, { color: colors.textPrimary }]}>
                      Ainda não tens metas registadas
                    </Text>
                    <Text style={[styles.noGoalsSub, { color: colors.textSecondary }]}>
                      Define um objetivo ou faz perguntas gerais sobre os teus gastos e orçamento.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleOpenGoalModalFromChat()}
                    style={[styles.addGoalOutlineBtn, { borderColor: colors.primaryCyan }]}
                  >
                    <Text style={[styles.addGoalOutlineBtnText, { color: colors.primaryCyan }]}>+ Criar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Mensagens da Conversa em Cristal */}
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.dynamicMsgBox,
                  msg.sender === 'user'
                    ? [styles.dynamicMsgUser, { backgroundColor: colors.primaryCyan, shadowColor: colors.primaryCyan }]
                    : [styles.dynamicMsgAi, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderTopColor: colors.glassBorderTop }],
                ]}
              >
                {msg.sender === 'ai' && (
                  <View style={styles.aiSenderHeader}>
                    <Ionicons name="sparkles" size={14} color={colors.primaryCyan} />
                    <Text style={[styles.aiSenderName, { color: colors.primaryCyan }]}>Carterinha Consultor</Text>
                  </View>
                )}

                <Text style={[styles.dynamicMsgText, { color: msg.sender === 'user' ? '#FFFFFF' : colors.textPrimary }]}>
                  {msg.text}
                </Text>

                {/* Gastos a cortar */}
                {msg.expensesToCut && msg.expensesToCut.length > 0 && (
                  <View style={[styles.cutsBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
                    <View style={styles.cutsHeaderRow}>
                      <Ionicons name="cut-outline" size={14} color={colors.accentRed} />
                      <Text style={[styles.cutsTitle, { color: colors.accentRed }]}>Gastos sugeridos para corte:</Text>
                    </View>
                    {msg.expensesToCut.map((cut, cIdx) => (
                      <Text key={cIdx} style={[styles.cutItemText, { color: colors.textPrimary }]}>
                        • {cut}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Plano de Ação */}
                {msg.actionPlan && msg.actionPlan.length > 0 && (
                  <View style={[styles.planBox, { backgroundColor: colors.primaryCyanLight, borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                    <View style={styles.cutsHeaderRow}>
                      <Ionicons name="clipboard-outline" size={14} color={colors.primaryCyan} />
                      <Text style={[styles.cutsTitle, { color: colors.primaryCyan }]}>Plano de Ação:</Text>
                    </View>
                    {msg.actionPlan.map((step, sIdx) => (
                      <Text key={sIdx} style={[styles.stepItemText, { color: colors.textPrimary }]}>
                        {sIdx + 1}. {step}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Botões Interativos: Sim (Cadastrar Meta) / Não (Apenas Plano) */}
                {msg.suggestGoalCreation && !msg.respondedToAction && (
                  <View style={styles.actionRowContainer}>
                    <Text style={[styles.actionPromptText, { color: colors.textSecondary }]}>
                      Queres cadastrar esta meta na tua Carterinha agora?
                    </Text>
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={[styles.actionBtnConfirm, { backgroundColor: colors.accentGreen }]}
                        onPress={() => handleOpenGoalModalFromChat(msg.suggestedGoalName, msg.suggestedGoalTarget)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 5 }} />
                        <Text style={styles.actionBtnConfirmText}>Sim, cadastrar meta</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtnReject, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
                        onPress={() => handleRejectGoalFromChat(msg.suggestedGoalName, msg.suggestedGoalTarget)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-circle-outline" size={16} color={colors.textMuted} style={{ marginRight: 5 }} />
                        <Text style={[styles.actionBtnRejectText, { color: colors.textSecondary }]}>Não agora</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {loading && (
              <View
                style={[
                  styles.dynamicMsgBox,
                  styles.dynamicMsgAi,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                  },
                ]}
              >
                <ActivityIndicator size="small" color={colors.primaryCyan} />
                <Text style={[styles.dynamicMsgText, { color: colors.primaryCyan, fontSize: 13, fontWeight: '700' }]}>
                  Consultor a analisar finanças e metas...
                </Text>
              </View>
            )}
          </>
        ) : (
          /* ABA: PERFIL DE MACHINE LEARNING */
          <View style={styles.mlContainer}>
            {loadingML ? (
              <ActivityIndicator size="large" color={colors.primaryCyan} style={{ marginTop: 40 }} />
            ) : mlProfile ? (
              <>
                <View style={[styles.archetypeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.archetypeHeader}>
                    <View style={[styles.archetypeIconBox, { backgroundColor: colors.primaryCyanLight }]}>
                      <Ionicons name="analytics-outline" size={28} color={colors.primaryCyan} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.archetypeLabel, { color: colors.textMuted }]}>PERFIL COMPORTAMENTAL</Text>
                      <Text style={[styles.archetypeName, { color: colors.textPrimary }]}>{mlProfile.archetype}</Text>
                      <Text style={[styles.archetypeBadge, { color: colors.primaryCyan }]}>{mlProfile.archetype_badge}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.metricsGrid}>
                  <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Risco de Impulso</Text>
                    <Text style={[styles.metricValue, { color: mlProfile.impulse_risk_score > 50 ? colors.accentRed : colors.accentGreen }]}>
                      {mlProfile.impulse_risk_score}/100
                    </Text>
                    <Text style={[styles.metricSub, { color: colors.textMuted }]}>Baseado em fins de semana</Text>
                  </View>

                  <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Queima Diária</Text>
                    <Text style={[styles.metricValue, { color: colors.primaryCyan }]}>
                      {mlProfile.daily_burn_rate.toFixed(0)} MT
                    </Text>
                    <Text style={[styles.metricSub, { color: colors.textMuted }]}>Média por dia</Text>
                  </View>

                  <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Autonomia</Text>
                    <Text style={[styles.metricValue, { color: colors.accentPurple }]}>
                      {mlProfile.days_until_depleted} dias
                    </Text>
                    <Text style={[styles.metricSub, { color: colors.textMuted }]}>Até esgotar saldo</Text>
                  </View>

                  <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Fim de Semana</Text>
                    <Text style={[styles.metricValue, { color: colors.accentAmber }]}>
                      {mlProfile.weekend_concentration_pct}%
                    </Text>
                    <Text style={[styles.metricSub, { color: colors.textMuted }]}>Concentração Sex-Dom</Text>
                  </View>
                </View>

                <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>Padrões Identificados</Text>
                <View style={[styles.insightsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {mlProfile.ml_insights.map((insight, idx) => (
                    <View key={idx} style={styles.insightRow}>
                      <Ionicons name="bulb-outline" size={18} color={colors.primaryCyan} style={{ marginTop: 2 }} />
                      <Text style={[styles.insightText, { color: colors.textPrimary }]}>{insight}</Text>
                    </View>
                  ))}
                </View>

                <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>Plano de Ação Proativo</Text>
                <View style={[styles.actionPlanCard, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                  <Ionicons name="sparkles" size={18} color={colors.accentGreen} />
                  <Text style={[styles.actionPlanText, { color: colors.textPrimary }]}>{mlProfile.personalized_action_plan}</Text>
                </View>
              </>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Barra Inferior com Sugestões Rápidas e Campo de Pergunta */}
      {activeSubTab === 'advisor' && (
        <View style={styles.bottomDock}>
          {/* Chips de Sugestões Rápidas */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickChipsScroll}
            style={styles.quickChipsWrapper}
          >
            {QUICK_PROMPTS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.quickChip, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderTopColor: colors.glassBorderTop }]}
                onPress={() => handleSendMessage(item.text)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={14} color={colors.primaryCyan} style={{ marginRight: 6 }} />
                <Text style={[styles.quickChipText, { color: colors.textPrimary }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Barra de Pergunta Inferior em Cristal */}
          <View style={[styles.inputBar, { backgroundColor: colors.glassSurfaceElevated, borderColor: colors.glassBorder, borderTopColor: colors.glassBorderTop, shadowColor: colors.crystalGlow }]}>
            <TextInput
              style={[styles.chatInput, { color: colors.textPrimary }]}
              placeholder={t.placeholderAiAdvisor}
              placeholderTextColor={colors.textMuted}
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={() => handleSendMessage()}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.primaryCyan }]}
              onPress={() => handleSendMessage()}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal de Histórico da Meta */}
      <GoalHistoryModal
        visible={historyModalVisible}
        goal={selectedGoalForHistory}
        transactions={transactions}
        onClose={() => setHistoryModalVisible(false)}
        onConsultInChat={handleConsultGoalDedicated}
      />

      {/* Modal de Cadastro de Meta sobre a mesma tela */}
      <GoalModal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        onSubmit={handleCreateGoalFromChat}
        initialName={pendingGoalName}
        initialTargetAmount={pendingGoalTarget}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modeTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    marginBottom: 8,
  },
  modeTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 155,
  },
  goalsSectionContainer: {
    marginBottom: 16,
  },
  goalsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  addGoalSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addGoalSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  goalsScrollContainer: {
    paddingRight: 10,
    gap: 12,
  },
  horizontalGoalCard: {
    width: 220,
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalCardName: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  goalCardPctBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  goalCardPctText: {
    fontSize: 11,
    fontWeight: '800',
  },
  goalCardAmountsRow: {
    gap: 2,
    marginBottom: 10,
  },
  goalCardAmountMuted: {
    fontSize: 11,
  },
  askAboutGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  askAboutGoalBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noGoalsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  noGoalsTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  noGoalsSub: {
    fontSize: 11,
    marginTop: 2,
  },
  addGoalOutlineBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addGoalOutlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomDock: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
  },
  quickChipsWrapper: {
    marginBottom: 8,
  },
  quickChipsScroll: {
    gap: 8,
    paddingHorizontal: 2,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  chatInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  dynamicMsgBox: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    maxWidth: '88%',
    borderWidth: 1,
  },
  dynamicMsgUser: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  dynamicMsgAi: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  aiSenderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  aiSenderName: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dynamicMsgText: {
    fontSize: 13,
    lineHeight: 19,
  },
  cutsBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  planBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  cutsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cutsTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  cutItemText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  stepItemText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  actionRowContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionPromptText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnConfirm: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnReject: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnRejectText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  loadingAiText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mlContainer: {
    gap: 14,
  },
  archetypeCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  archetypeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  archetypeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  archetypeName: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  archetypeBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48.5%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 2,
  },
  insightsCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  actionPlanCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  actionPlanText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
});
