import React, { useEffect, useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { PriceComparisonResult, PriceRecord, TrackedProduct } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { formatCurrency } from '../utils/formatters';

interface PriceComparisonScreenProps {
  onBack?: () => void;
  onNavigateScanner?: () => void;
}

type TabType = 'history' | 'simulator' | 'stores';

const DEFAULT_POPULAR_SUGGESTIONS = [
  'Arroz 5kg',
  'Óleo 1L',
  'Açúcar 1kg',
  'Café 250g',
  'Farinha de Milho',
  'Pão',
  'Frango',
  'Credelec EDM',
];

const POPULAR_STORES = ['Shoprite', 'VIP Spar', 'Recheio', 'Jumbo', 'Mercado Local'];

export const PriceComparisonScreen: React.FC<PriceComparisonScreenProps> = ({
  onBack,
  onNavigateScanner,
}) => {
  const { t, currencySymbol, language } = useTranslation();
  const {
    theme,
    userProfile,
    transactions,
    getTrackedProducts,
    getPriceHistory,
    checkPriceComparison,
    addTransaction,
  } = useFinanceStore();

  const colors = getTheme(theme, userProfile.primaryColor);

  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('Arroz');
  const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Estados do Simulador de Loja
  const [simProduct, setSimProduct] = useState('');
  const [simStore, setSimStore] = useState('Shoprite');
  const [simPrice, setSimPrice] = useState('');
  const [simResult, setSimResult] = useState<PriceComparisonResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Carregar produtos rastreados das transações reais
  useEffect(() => {
    loadProducts();
  }, [transactions]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const prods = await getTrackedProducts();
      setTrackedProducts(prods);
      if (prods.length > 0 && (!selectedProduct || selectedProduct === 'Arroz')) {
        setSelectedProduct(prods[0].name);
        setSimProduct(prods[0].name);
      }
    } catch {
      // fallback
    } finally {
      setLoadingProducts(false);
    }
  };

  // Carregar histórico de preços do produto selecionado
  useEffect(() => {
    if (selectedProduct) {
      loadPriceHistory(selectedProduct);
    }
  }, [selectedProduct]);

  const loadPriceHistory = async (productName: string) => {
    setLoadingHistory(true);
    try {
      const records = await getPriceHistory(productName);
      setPriceHistory(records);
    } catch {
      setPriceHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectChip = (productName: string) => {
    setSelectedProduct(productName);
    setSearchQuery(productName);
    setSimProduct(productName);
  };

  // Filtrar produtos rastreados pela pesquisa
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return trackedProducts;
    const q = searchQuery.toLowerCase().trim();
    return trackedProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [trackedProducts, searchQuery]);

  // Métricas do produto selecionado
  const productMetrics = useMemo(() => {
    if (priceHistory.length === 0) return null;
    const prices = priceHistory.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const bestRecord = priceHistory.find((p) => p.price === minPrice);
    const worstRecord = priceHistory.find((p) => p.price === maxPrice);
    const diff = maxPrice - minPrice;
    const diffPct = maxPrice > 0 ? (diff / maxPrice) * 100 : 0;
    const avgPrice = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;

    return {
      minPrice,
      maxPrice,
      avgPrice,
      diff,
      diffPct,
      bestStore: bestRecord?.store_name || 'Estabelecimento',
      worstStore: worstRecord?.store_name || 'Estabelecimento',
      count: priceHistory.length,
    };
  }, [priceHistory]);

  // Agregação de lojas para o Radar de Lojas
  const storeStats = useMemo(() => {
    const map = new Map<
      string,
      { name: string; totalSpent: number; txCount: number; lastDate: string }
    >();
    for (const tx of transactions) {
      const storeName = tx.store_name?.trim();
      if (storeName && storeName.length >= 2) {
        const key = storeName.toLowerCase();
        const existing = map.get(key) || {
          name: storeName,
          totalSpent: 0,
          txCount: 0,
          lastDate: tx.created_at.split('T')[0],
        };
        existing.totalSpent += tx.amount;
        existing.txCount += 1;
        if (tx.created_at > existing.lastDate) {
          existing.lastDate = tx.created_at.split('T')[0];
        }
        map.set(key, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.txCount - a.txCount);
  }, [transactions]);

  // Executar Simulação de Preço
  const handleRunSimulation = async () => {
    const numPrice = parseFloat(simPrice.replace(',', '.'));
    if (!simProduct.trim()) {
      Alert.alert('Produto Necessário', 'Por favor, indica o nome do produto a comparar.');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      Alert.alert('Preço Inválido', 'Por favor, introduz um valor válido em Meticais.');
      return;
    }

    setIsSimulating(true);
    try {
      const res = await checkPriceComparison(simProduct.trim(), numPrice, simStore.trim());
      setSimResult(res);
    } catch {
      Alert.alert('Erro', 'Não foi possível efetuar a comparação neste momento.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Gravar a despesa diretamente a partir do simulador
  const handleSaveSimulatedExpense = async () => {
    const numPrice = parseFloat(simPrice.replace(',', '.'));
    if (!simProduct.trim() || isNaN(numPrice) || numPrice <= 0) return;

    try {
      await addTransaction(
        simProduct.trim(),
        numPrice,
        true,
        'essential',
        undefined,
        simStore.trim() || undefined
      );
      Alert.alert('Despesa Registada', `A compra de "${simProduct.trim()}" foi gravada com sucesso!`);
      setSimPrice('');
      setSimResult(null);
      loadProducts();
    } catch {
      Alert.alert('Erro', 'Não foi possível registar a despesa.');
    }
  };

  const getItemIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('café') || n.includes('chá')) return 'cafe-outline';
    if (n.includes('arroz') || n.includes('farinha') || n.includes('pão') || n.includes('açúcar'))
      return 'nutrition-outline';
    if (n.includes('frango') || n.includes('carne') || n.includes('peixe')) return 'restaurant-outline';
    if (n.includes('óleo') || n.includes('azeite')) return 'water-outline';
    if (n.includes('credelec') || n.includes('luz') || n.includes('energia')) return 'flash-outline';
    return 'pricetag-outline';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar One UI 8.5 */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.backBtn,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            {t.priceComparisonTitle}
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textMuted }]}>
            {t.priceComparisonSubtitle}
          </Text>
        </View>

        {onNavigateScanner ? (
          <TouchableOpacity
            onPress={onNavigateScanner}
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.primaryCyanLight,
                borderColor: colors.primaryCyan,
              },
            ]}
          >
            <Ionicons name="camera-outline" size={20} color={colors.primaryCyan} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {/* Segmented Tabs One UI 8.5 */}
      <View style={styles.tabBarContainer}>
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'history' && [styles.activeTabBtn, { backgroundColor: colors.primaryCyan }],
            ]}
            onPress={() => setActiveTab('history')}
          >
            <Ionicons
              name={activeTab === 'history' ? 'time' : 'time-outline'}
              size={15}
              color={activeTab === 'history' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'history' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {t.tabPriceHistory}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'simulator' && [styles.activeTabBtn, { backgroundColor: colors.primaryCyan }],
            ]}
            onPress={() => setActiveTab('simulator')}
          >
            <Ionicons
              name={activeTab === 'simulator' ? 'calculator' : 'calculator-outline'}
              size={15}
              color={activeTab === 'simulator' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'simulator' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {t.tabPriceSimulator}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'stores' && [styles.activeTabBtn, { backgroundColor: colors.primaryCyan }],
            ]}
            onPress={() => setActiveTab('stores')}
          >
            <Ionicons
              name={activeTab === 'stores' ? 'business' : 'business-outline'}
              size={15}
              color={activeTab === 'stores' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'stores' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {t.tabStores}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* =================================================== */}
        {/* ABA 1: HISTÓRICO E ANÁLISE DE PRODUTO                */}
        {/* =================================================== */}
        {activeTab === 'history' && (
          <View>
            {/* Barra de Pesquisa Rápida */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
            >
              <Ionicons name="search-outline" size={18} color={colors.primaryCyan} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder={t.placeholderSearchItem}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.trim().length >= 2) {
                    setSelectedProduct(text.trim());
                  }
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Chips de Sugestões e Produtos Rastreados */}
            <View style={styles.chipsSection}>
              <Text style={[styles.chipsLabel, { color: colors.textMuted }]}>
                {trackedProducts.length > 0 ? 'OS TEUS PRODUTOS RASTREADOS' : 'SUGESTÕES DE PESQUISA'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {(trackedProducts.length > 0
                  ? trackedProducts.map((p) => p.name)
                  : DEFAULT_POPULAR_SUGGESTIONS
                ).map((name, idx) => {
                  const isSelected =
                    selectedProduct.toLowerCase() === name.toLowerCase() ||
                    searchQuery.toLowerCase() === name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primaryCyanLight : colors.glassSurface,
                          borderColor: isSelected ? colors.primaryCyan : colors.glassBorder,
                        },
                      ]}
                      onPress={() => handleSelectChip(name)}
                    >
                      <Ionicons
                        name={getItemIcon(name) as any}
                        size={13}
                        color={isSelected ? colors.primaryCyan : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected ? colors.primaryCyan : colors.textPrimary,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Cartão do Produto Selecionado */}
            <View
              style={[
                styles.productHeroCard,
                {
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                  shadowColor: colors.cardShadow,
                },
              ]}
            >
              <View style={styles.heroHeaderRow}>
                <View
                  style={[
                    styles.heroIconBox,
                    {
                      backgroundColor: colors.glassSurfaceElevated,
                      borderColor: colors.glassBorder,
                      borderTopColor: colors.glassBorderTop,
                    },
                  ]}
                >
                  <Ionicons
                    name={getItemIcon(selectedProduct) as any}
                    size={28}
                    color={colors.primaryCyan}
                  />
                </View>

                <View style={styles.heroTitleCol}>
                  <Text style={[styles.heroProductName, { color: colors.textPrimary }]}>
                    {selectedProduct || 'Produto Selecionado'}
                  </Text>
                  <Text style={[styles.heroStoreSummary, { color: colors.textSecondary }]}>
                    {productMetrics
                      ? `${productMetrics.count} registos • Melhor preço no ${productMetrics.bestStore}`
                      : 'Sem registos anteriores nesta descrição'}
                  </Text>
                </View>
              </View>

              {/* Indicadores Chave de Preço (KPIs) */}
              {productMetrics && (
                <View style={styles.kpiGrid}>
                  <View
                    style={[
                      styles.kpiCard,
                      {
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        borderColor: 'rgba(16, 185, 129, 0.25)',
                      },
                    ]}
                  >
                    <Text style={[styles.kpiLabel, { color: colors.accentGreen }]}>MENOR PREÇO</Text>
                    <Text style={[styles.kpiValue, { color: colors.accentGreen }]}>
                      {productMetrics.minPrice.toFixed(0)} MT
                    </Text>
                    <Text style={[styles.kpiSub, { color: colors.textMuted }]} numberOfLines={1}>
                      {productMetrics.bestStore}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.kpiCard,
                      {
                        backgroundColor: colors.glassSurfaceElevated,
                        borderColor: colors.glassBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>PREÇO MÉDIO</Text>
                    <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                      {productMetrics.avgPrice.toFixed(0)} MT
                    </Text>
                    <Text style={[styles.kpiSub, { color: colors.textMuted }]}>
                      Média compras
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.kpiCard,
                      {
                        backgroundColor:
                          productMetrics.diff > 0
                            ? 'rgba(217, 119, 6, 0.08)'
                            : colors.glassSurfaceElevated,
                        borderColor:
                          productMetrics.diff > 0
                            ? 'rgba(217, 119, 6, 0.25)'
                            : colors.glassBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.kpiLabel, { color: colors.accentAmber }]}>VARIAÇÃO</Text>
                    <Text style={[styles.kpiValue, { color: colors.accentAmber }]}>
                      {productMetrics.diff > 0 ? `+${productMetrics.diff.toFixed(0)} MT` : '0 MT'}
                    </Text>
                    <Text style={[styles.kpiSub, { color: colors.textMuted }]}>
                      {productMetrics.diffPct > 0 ? `${productMetrics.diffPct.toFixed(0)}% poupança` : 'Preço único'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Parecer Inteligente / Alerta Contextual (Apenas 1 relevante, sem contradições) */}
            {productMetrics && productMetrics.diff > 0 && (
              <View
                style={[
                  styles.insightBanner,
                  {
                    backgroundColor: 'rgba(5, 150, 105, 0.08)',
                    borderColor: 'rgba(5, 150, 105, 0.25)',
                  },
                ]}
              >
                <View style={styles.insightHeader}>
                  <Ionicons name="sparkles" size={17} color={colors.accentGreen} />
                  <Text style={[styles.insightTitle, { color: colors.accentGreen }]}>
                    Dica de Poupança Carterinha
                  </Text>
                </View>
                <Text style={[styles.insightBody, { color: colors.textPrimary }]}>
                  Ao comprar <Text style={{ fontWeight: '800' }}>"{selectedProduct}"</Text> no{' '}
                  <Text style={{ fontWeight: '800' }}>{productMetrics.bestStore}</Text> a{' '}
                  <Text style={{ fontWeight: '800' }}>{productMetrics.minPrice.toFixed(0)} MT</Text> em vez
                  do {productMetrics.worstStore} ({productMetrics.maxPrice.toFixed(0)} MT), poupas{' '}
                  <Text style={{ fontWeight: '800', color: colors.accentGreen }}>
                    {productMetrics.diff.toFixed(0)} MT ({productMetrics.diffPct.toFixed(0)}%)
                  </Text>{' '}
                  por cada compra.
                </Text>
              </View>
            )}

            {/* Lista Cronológica do Histórico de Preços */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                HISTÓRICO DE COMPRAS (MT)
              </Text>
              <Text style={[styles.sectionCounter, { color: colors.textMuted }]}>
                {priceHistory.length} registos
              </Text>
            </View>

            {loadingHistory ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primaryCyan} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  A consultar registos de preços...
                </Text>
              </View>
            ) : priceHistory.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  Sem histórico para "{selectedProduct}"
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Usa o Simulador de Loja abaixo para testar um preço de prateleira ou digitaliza uma
                  fatura para registar automaticamente.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyActionBtn, { backgroundColor: colors.primaryCyan }]}
                  onPress={() => {
                    setSimProduct(selectedProduct);
                    setActiveTab('simulator');
                  }}
                >
                  <Ionicons name="calculator-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.emptyActionBtnText}>Simular Preço no Supermercado</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.historyList}>
                {priceHistory.map((item, index) => {
                  const isLowest = productMetrics && item.price === productMetrics.minPrice;
                  const isHighest =
                    productMetrics &&
                    productMetrics.diff > 0 &&
                    item.price === productMetrics.maxPrice;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.historyCard,
                        {
                          backgroundColor: colors.glassSurface,
                          borderColor: isLowest
                            ? 'rgba(16, 185, 129, 0.4)'
                            : isHighest
                            ? 'rgba(225, 29, 72, 0.25)'
                            : colors.glassBorder,
                          borderTopColor: isLowest
                            ? 'rgba(16, 185, 129, 0.6)'
                            : colors.glassBorderTop,
                          shadowColor: colors.cardShadow,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: isLowest
                              ? colors.accentGreen
                              : isHighest
                              ? colors.accentRed
                              : colors.primaryCyan,
                          },
                        ]}
                      />

                      <View style={styles.storeDetails}>
                        <View style={styles.storeNameRow}>
                          <Text style={[styles.storeName, { color: colors.textPrimary }]}>
                            {item.store_name}
                          </Text>
                          {isLowest && (
                            <View
                              style={[
                                styles.badgeBest,
                                { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                              ]}
                            >
                              <Text style={styles.badgeBestText}>Melhor Preço ✓</Text>
                            </View>
                          )}
                          {isHighest && (
                            <View
                              style={[
                                styles.badgeWorst,
                                { backgroundColor: 'rgba(225, 29, 72, 0.12)' },
                              ]}
                            >
                              <Text style={styles.badgeWorstText}>Mais Alto</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.storeDate, { color: colors.textMuted }]}>
                          {item.date ? new Date(item.date).toLocaleDateString('pt-PT') : 'Compra recente'}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.priceAmount,
                          {
                            color: isLowest
                              ? colors.accentGreen
                              : isHighest
                              ? colors.accentRed
                              : colors.textPrimary,
                          },
                        ]}
                      >
                        {item.price.toFixed(0)} MT
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* =================================================== */}
        {/* ABA 2: SIMULADOR DE SUPERMERCADO                   */}
        {/* =================================================== */}
        {activeTab === 'simulator' && (
          <View>
            <View
              style={[
                styles.simulatorIntroCard,
                {
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
            >
              <View style={styles.simulatorIntroHeader}>
                <View
                  style={[
                    styles.simIconBox,
                    { backgroundColor: colors.primaryCyanLight, borderColor: colors.primaryCyan },
                  ]}
                >
                  <Ionicons name="cart-outline" size={24} color={colors.primaryCyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.simIntroTitle, { color: colors.textPrimary }]}>
                    No Supermercado ou a Comprar?
                  </Text>
                  <Text style={[styles.simIntroSubtitle, { color: colors.textSecondary }]}>
                    Introduz o preço da prateleira para verificar se é um bom negócio antes de pagar.
                  </Text>
                </View>
              </View>

              {/* Formulário de Simulação */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PRODUTO</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t.placeholderItemName}
                placeholderTextColor={colors.textMuted}
                value={simProduct}
                onChangeText={setSimProduct}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ESTABELECIMENTO / LOJA</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t.placeholderStoreName}
                placeholderTextColor={colors.textMuted}
                value={simStore}
                onChangeText={setSimStore}
              />

              {/* Lojas Frequentes Rápidas */}
              <View style={styles.quickStoresRow}>
                {POPULAR_STORES.map((st, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.quickStoreChip,
                      {
                        backgroundColor: simStore === st ? colors.primaryCyanLight : colors.glassSurface,
                        borderColor: simStore === st ? colors.primaryCyan : colors.glassBorder,
                      },
                    ]}
                    onPress={() => setSimStore(st)}
                  >
                    <Text
                      style={[
                        styles.quickStoreText,
                        { color: simStore === st ? colors.primaryCyan : colors.textSecondary },
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PREÇO NA PRATELEIRA (MT)</Text>
              <TextInput
                style={[
                  styles.formInput,
                  styles.priceInputLarge,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.primaryCyan,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t.amountPlaceholder}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={simPrice}
                onChangeText={setSimPrice}
              />

              <TouchableOpacity
                style={[
                  styles.simActionBtn,
                  { shadowColor: colors.primaryCyan },
                  isSimulating && { opacity: 0.7 },
                ]}
                onPress={handleRunSimulation}
                disabled={isSimulating}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={colors.gradients.cyan}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.simBtnGradient}
                >
                  {isSimulating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                      <Text style={styles.simBtnText}>Comparar com Histórico</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Resultado da Simulação */}
            {simResult && (
              <View
                style={[
                  styles.simResultCard,
                  {
                    backgroundColor: simResult.is_cheaper
                      ? 'rgba(5, 150, 105, 0.09)'
                      : simResult.is_more_expensive
                      ? 'rgba(225, 29, 72, 0.09)'
                      : colors.glassSurface,
                    borderColor: simResult.is_cheaper
                      ? 'rgba(5, 150, 105, 0.3)'
                      : simResult.is_more_expensive
                      ? 'rgba(225, 29, 72, 0.3)'
                      : colors.glassBorder,
                  },
                ]}
              >
                <View style={styles.simResultHeader}>
                  <Ionicons
                    name={
                      simResult.is_cheaper
                        ? 'checkmark-circle'
                        : simResult.is_more_expensive
                        ? 'warning'
                        : 'information-circle'
                    }
                    size={24}
                    color={
                      simResult.is_cheaper
                        ? colors.accentGreen
                        : simResult.is_more_expensive
                        ? colors.accentRed
                        : colors.primaryCyan
                    }
                  />
                  <Text
                    style={[
                      styles.simResultTitle,
                      {
                        color: simResult.is_cheaper
                          ? colors.accentGreen
                          : simResult.is_more_expensive
                          ? colors.accentRed
                          : colors.textPrimary,
                      },
                    ]}
                  >
                    {simResult.is_cheaper
                      ? 'Boa Escolha! Poupança Identificada'
                      : simResult.is_more_expensive
                      ? 'Atenção: Preço Superior ao Histórico'
                      : 'Preço de Referência Alinhado'}
                  </Text>
                </View>

                <Text style={[styles.simResultMessage, { color: colors.textPrimary }]}>
                  {simResult.message}
                </Text>

                {simResult.saving_tip && (
                  <Text style={[styles.simResultTip, { color: colors.textSecondary }]}>
                    💡 {simResult.saving_tip}
                  </Text>
                )}

                {/* Ação de Gravar Compra Diretamente */}
                <TouchableOpacity
                  style={[styles.recordBtn, { backgroundColor: colors.primaryCyan }]}
                  onPress={handleSaveSimulatedExpense}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.recordBtnText}>Gravar como Despesa Real</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* =================================================== */}
        {/* ABA 3: RADAR DE LOJAS E ESTABELECIMENTOS           */}
        {/* =================================================== */}
        {activeTab === 'stores' && (
          <View>
            <View
              style={[
                styles.storesHeaderCard,
                {
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder,
                  borderTopColor: colors.glassBorderTop,
                },
              ]}
            >
              <Ionicons name="map-outline" size={24} color={colors.primaryCyan} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.storesHeaderTitle, { color: colors.textPrimary }]}>
                  Radar de Estabelecimentos
                </Text>
                <Text style={[styles.storesHeaderSubtitle, { color: colors.textSecondary }]}>
                  Onde costumas comprar mais e com melhor relação custo-benefício em Moçambique.
                </Text>
              </View>
            </View>

            {storeStats.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Ionicons name="business-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  Ainda sem lojas registadas
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Ao digitalizares faturas ou indicares a loja nas tuas despesas, o Carterinhas gera o teu
                  mapa comparativo de lojas automaticamente.
                </Text>
              </View>
            ) : (
              <View style={styles.storesList}>
                {storeStats.map((store, index) => (
                  <View
                    key={index}
                    style={[
                      styles.storeCard,
                      {
                        backgroundColor: colors.glassSurface,
                        borderColor: colors.glassBorder,
                        borderTopColor: colors.glassBorderTop,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.storeBadgeIcon,
                        {
                          backgroundColor: colors.glassSurfaceElevated,
                          borderColor: colors.glassBorder,
                        },
                      ]}
                    >
                      <Ionicons name="storefront-outline" size={20} color={colors.primaryCyan} />
                    </View>

                    <View style={styles.storeMainInfo}>
                      <Text style={[styles.storeCardName, { color: colors.textPrimary }]}>
                        {store.name}
                      </Text>
                      <Text style={[styles.storeCardSub, { color: colors.textMuted }]}>
                        {store.txCount} {store.txCount === 1 ? 'compra' : 'compras'} • Última:{' '}
                        {new Date(store.lastDate).toLocaleDateString('pt-PT')}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.storeCardTotal, { color: colors.textPrimary }]}>
                        {store.totalSpent.toLocaleString('pt-PT', { minimumFractionDigits: 0 })} MT
                      </Text>
                      <Text style={[styles.storeCardTotalLabel, { color: colors.textMuted }]}>
                        Total gasto
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  titleContainer: {
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  tabBarContainer: {
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 14,
  },
  activeTabBtn: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 160,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  chipsSection: {
    marginBottom: 14,
  },
  chipsLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  chipsScroll: {
    gap: 8,
    paddingBottom: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  productHeroCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  heroTitleCol: {
    flex: 1,
  },
  heroProductName: {
    fontSize: 17,
    fontWeight: '800',
  },
  heroStoreSummary: {
    fontSize: 12,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  kpiSub: {
    fontSize: 10,
    marginTop: 2,
  },
  insightBanner: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  insightBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionCounter: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  storeDetails: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  storeName: {
    fontSize: 13,
    fontWeight: '800',
  },
  badgeBest: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeBestText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  badgeWorst: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeWorstText: {
    color: '#E11D48',
    fontSize: 9,
    fontWeight: '800',
  },
  storeDate: {
    fontSize: 11,
    marginTop: 2,
  },
  priceAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  simulatorIntroCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  simulatorIntroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  simIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  simIntroTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  simIntroSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  formInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    marginBottom: 12,
  },
  priceInputLarge: {
    fontSize: 18,
    fontWeight: '900',
  },
  quickStoresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  quickStoreChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickStoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  simActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  simBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  simBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  simResultCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    marginTop: 4,
    gap: 10,
  },
  simResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simResultTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  simResultMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  simResultTip: {
    fontSize: 11,
    lineHeight: 16,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 4,
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  storesHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
  },
  storesHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  storesHeaderSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  storesList: {
    gap: 10,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  storeBadgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  storeMainInfo: {
    flex: 1,
  },
  storeCardName: {
    fontSize: 14,
    fontWeight: '800',
  },
  storeCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  storeCardTotal: {
    fontSize: 15,
    fontWeight: '900',
  },
  storeCardTotalLabel: {
    fontSize: 10,
    marginTop: 1,
  },
});
