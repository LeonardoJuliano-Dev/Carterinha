import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { ReceiptExtractionResult } from '../types';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';
import { useTranslation } from '../i18n/useTranslation';
import { formatCurrency } from '../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReceiptScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onExtracted: (result: ReceiptExtractionResult) => void;
}

export function ReceiptScannerModal({
  visible,
  onClose,
  onExtracted,
}: ReceiptScannerModalProps) {
  const { t, currencySymbol } = useTranslation();
  const { scanReceipt, theme, userProfile, addTransaction } = useFinanceStore();
  const colors = getTheme(theme, userProfile.primaryColor);

  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ReceiptExtractionResult | null>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editTotalAmount, setEditTotalAmount] = useState('');

  const handleConfirmAndSave = async () => {
    if (!extractedData) return;
    const finalStore = editStoreName.trim() || extractedData.store_name || t.storeEstablishment;
    const parsedAmount = parseFloat(editTotalAmount.replace(',', '.'));
    const finalAmount = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : extractedData.total_amount;

    if (finalAmount <= 0) {
      Alert.alert(t.totalAmount, t.errorExpenseAmount);
      return;
    }

    try {
      await addTransaction(
        `Compras ${finalStore}`,
        finalAmount,
        extractedData.is_essential,
        extractedData.category,
        undefined,
        finalStore,
        extractedData.items.map((i) => `${i.name}: ${i.price} ${currencySymbol}`).join(', ')
      );
      setConfirmed(true);
      setTimeout(() => {
        setConfirmed(false);
        setCapturedImageUri(null);
        setExtractedData(null);
        setEditStoreName('');
        setEditTotalAmount('');
        onClose();
        onExtracted({
          ...extractedData,
          store_name: finalStore,
          total_amount: finalAmount,
        });
      }, 1000);
    } catch {
      Alert.alert('Erro', 'Não foi possível gravar a fatura.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Necessária', 'É necessária permissão para aceder à câmara.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImageUri(result.assets[0].uri);
        processImage(result.assets[0].base64, result.assets[0].fileName || 'fatura.jpg');
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível aceder à câmara.');
    }
  };

  const handlePickGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Necessária', 'É necessária permissão para aceder à galeria.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImageUri(result.assets[0].uri);
        processImage(result.assets[0].base64, result.assets[0].fileName || 'fatura.jpg');
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível aceder à galeria.');
    }
  };

  const processImage = async (base64?: string | null, fileName?: string) => {
    setIsProcessing(true);
    setExtractedData(null);
    try {
      const extracted = await scanReceipt({
        imageBase64: base64 || undefined,
        fileName: fileName || 'fatura_recibo.jpg',
      });
      setExtractedData(extracted);
      setEditStoreName(extracted.store_name || '');
      setEditTotalAmount(extracted.total_amount > 0 ? String(extracted.total_amount) : '');
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      Alert.alert('Aviso', 'Não foi possível extrair automaticamente. Tente novamente ou introduza manualmente.');
    }
  };

  const handleRetake = () => {
    setCapturedImageUri(null);
    setExtractedData(null);
    setEditStoreName('');
    setEditTotalAmount('');
    setConfirmed(false);
  };

  const handleClose = () => {
    setCapturedImageUri(null);
    setExtractedData(null);
    setEditStoreName('');
    setEditTotalAmount('');
    setConfirmed(false);
    setIsProcessing(false);
    onClose();
  };

  // ─── Render: Empty State (no image captured yet) ───
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View
        style={[
          styles.emptyIconCircle,
          {
            backgroundColor: colors.glassSurface,
            borderColor: colors.glassBorder,
            borderTopColor: colors.glassBorderTop,
            borderWidth: 1.5,
          },
        ]}
      >
        <Ionicons name="receipt-outline" size={56} color={colors.primaryCyan} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {t.scanReceiptTitle}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {t.receiptEmptySubtitle}
      </Text>

      <View style={styles.emptyActionsRow}>
        <TouchableOpacity
          style={[styles.emptyActionBtn, { shadowColor: colors.primaryCyan }]}
          onPress={handleTakePhoto}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={colors.gradients.cyan}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyActionGradient}
          >
            <View style={styles.emptyActionIconBox}>
              <Ionicons name="camera" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.emptyActionLabel}>{t.camera}</Text>
            <Text style={styles.emptyActionHint}>{t.takePhotoNow}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.emptyActionBtn, { shadowColor: colors.accentPurple }]}
          onPress={handlePickGallery}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={colors.gradients.purple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyActionGradient}
          >
            <View style={styles.emptyActionIconBox}>
              <Ionicons name="images" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.emptyActionLabel}>{t.gallery}</Text>
            <Text style={styles.emptyActionHint}>{t.chooseImage}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tips */}
      <View
        style={[
          styles.tipsCard,
          {
            backgroundColor: colors.glassSurface,
            borderColor: colors.glassBorder,
            borderTopColor: colors.glassBorderTop,
          },
        ]}
      >
        <View style={styles.tipRow}>
          <Ionicons name="bulb-outline" size={16} color={colors.accentAmber} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            {t.tipLighting}
          </Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="scan-outline" size={16} color={colors.accentAmber} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            {t.tipFraming}
          </Text>
        </View>
      </View>
    </View>
  );

  // ─── Render: Image Preview + Extracted Data ───
  const renderPreviewState = () => (
    <View style={styles.previewContainer}>
      {/* Image Preview */}
      <View style={styles.imagePreviewWrapper}>
        <View style={styles.cameraFrameCorners}>
          <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primaryCyan }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primaryCyan }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primaryCyan }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primaryCyan }]} />

          {capturedImageUri && (
            <Image
              source={{ uri: capturedImageUri }}
              style={styles.capturedImage}
              resizeMode="contain"
            />
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <View style={styles.processingCard}>
                <ActivityIndicator size="large" color={colors.primaryCyan} />
                <Text style={styles.processingText}>{t.extractingAi}</Text>
                <Text style={styles.processingHint}>{t.fewSecondsWait}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Extracted Data Card */}
      {extractedData && !isProcessing && (
        <View
          style={[
            styles.extractedCard,
            {
              backgroundColor: colors.glassSurfaceElevated,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
        >
          {/* Success badge */}
          <View style={[styles.successBadge, { backgroundColor: 'rgba(5, 150, 105, 0.15)' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.accentGreen} />
            <Text style={[styles.successBadgeText, { color: colors.accentGreen }]}>
              {t.dataExtractedSuccess}
            </Text>
          </View>

          <View style={styles.extractedTopRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.fieldMiniLabel, { color: colors.textMuted }]}>{t.storeEstablishment}</Text>
              <TextInput
                style={[
                  styles.editStoreInput,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.glassBorder,
                    borderTopColor: colors.glassBorderTop,
                    backgroundColor: colors.glassInputBg,
                  },
                ]}
                value={editStoreName}
                onChangeText={setEditStoreName}
                placeholder={t.storeNamePlaceholder}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[styles.extractedDate, { color: colors.textMuted }]}>
                {extractedData.date || new Date().toLocaleDateString('pt-PT')}
              </Text>
            </View>
            <View style={{ width: 125 }}>
              <Text style={[styles.fieldMiniLabel, { color: colors.textMuted, textAlign: 'right' }]}>
                {t.totalAmount} ({currencySymbol})
              </Text>
              <TextInput
                style={[
                  styles.editAmountInput,
                  {
                    color: colors.primaryCyan,
                    borderColor: colors.glassBorder,
                    borderTopColor: colors.glassBorderTop,
                    backgroundColor: colors.glassInputBg,
                  },
                ]}
                value={editTotalAmount}
                onChangeText={setEditTotalAmount}
                keyboardType="decimal-pad"
                placeholder={t.amountPlaceholder}
                placeholderTextColor={colors.textMuted}
                textAlign="right"
              />
            </View>
          </View>

          {/* Items list */}
          {extractedData.items.length > 0 && (
            <View style={[styles.itemsList, { borderTopColor: colors.glassBorder }]}>
              <Text style={[styles.itemsTitle, { color: colors.textSecondary }]}>
                {extractedData.items.length} {t.itemsDetected}
              </Text>
              {extractedData.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
                    {formatCurrency(item.price, currencySymbol)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.categoryRow, { borderTopColor: colors.glassBorder }]}>
            <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
              {t.suggestedCategory}
            </Text>
            <View style={styles.categoryPill}>
              <Ionicons name="cart" size={14} color={colors.primaryCyan} />
              <Text style={[styles.categoryText, { color: colors.primaryCyan }]}>
                {extractedData.is_essential ? t.essential : t.lifestyle}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {extractedData && !isProcessing && (
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            { shadowColor: confirmed ? colors.accentGreen : colors.primaryCyan },
          ]}
          onPress={handleConfirmAndSave}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={confirmed ? colors.gradients.green : colors.gradients.cyan}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmGradient}
          >
            <Ionicons
              name={confirmed ? 'checkmark-circle' : 'checkmark'}
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.confirmBtnText}>
              {confirmed ? t.receiptSavedSuccess : t.confirmAndSave}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Retake / Gallery buttons */}
      <View style={styles.mediaActionsRow}>
        <TouchableOpacity
          style={[
            styles.mediaBtn,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
          onPress={handleRetake}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.accentRed} />
          <Text style={[styles.mediaBtnText, { color: colors.accentRed }]}>{t.restartBtn}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mediaBtn,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
          onPress={handleTakePhoto}
        >
          <Ionicons name="camera-outline" size={18} color={colors.primaryCyan} />
          <Text style={[styles.mediaBtnText, { color: colors.primaryCyan }]}>{t.newPhotoBtn}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mediaBtn,
            {
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder,
              borderTopColor: colors.glassBorderTop,
            },
          ]}
          onPress={handlePickGallery}
        >
          <Ionicons name="images-outline" size={18} color={colors.accentPurple} />
          <Text style={[styles.mediaBtnText, { color: colors.accentPurple }]}>{t.gallery}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={[styles.modalOverlay, { backgroundColor: colors.background }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleClose}
            style={[
              styles.topBtn,
              {
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
                borderTopColor: colors.glassBorderTop,
              },
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            {t.scanReceiptTitle}
          </Text>
          <View style={styles.topBtnPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!capturedImageUri ? renderEmptyState() : renderPreviewState()}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  topBtnPlaceholder: {
    width: 38,
    height: 38,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 40,
  },

  // ─── Empty State ───
  emptyStateContainer: {
    alignItems: 'center',
    paddingTop: 30,
  },
  emptyIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
    width: '100%',
  },
  emptyActionBtn: {
    flex: 1,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  emptyActionGradient: {
    paddingVertical: 22,
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  emptyActionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyActionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyActionHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tipsCard: {
    width: '100%',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },

  // ─── Preview State ───
  previewContainer: {
    gap: 16,
  },
  imagePreviewWrapper: {
    alignItems: 'center',
  },
  cameraFrameCorners: {
    width: '100%',
    padding: 12,
    position: 'relative',
    alignItems: 'center',
    minHeight: 260,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 },
  capturedImage: {
    width: SCREEN_WIDTH - 80,
    height: 300,
    borderRadius: 12,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  processingCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  processingHint: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },

  // ─── Extracted Card ───
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 14,
  },
  successBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  extractedCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  extractedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fieldMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  editStoreInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  editAmountInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '900',
  },
  extractedStore: {
    fontSize: 16,
    fontWeight: '800',
  },
  extractedDate: {
    fontSize: 12,
    marginTop: 2,
  },
  totalBox: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 11,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  itemsList: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginBottom: 10,
    gap: 6,
  },
  itemsTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '800',
  },
  confirmBtn: {
    borderRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  mediaActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mediaBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  mediaBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
