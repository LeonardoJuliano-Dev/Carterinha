import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFinanceStore } from '../stores/financeStore';
import { getTheme } from '../theme/colors';

interface CrystalCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  elevated?: boolean;
  hasSheen?: boolean;
  onPress?: () => void;
  activeOpacity?: number;
  borderRadius?: number;
  intensity?: number;
}

export const CrystalCard: React.FC<CrystalCardProps> = ({
  children,
  style,
  glowColor,
  elevated = false,
  hasSheen = true,
  onPress,
  activeOpacity = 0.85,
  borderRadius = 26,
  intensity = 35,
}) => {
  const { theme, userProfile } = useFinanceStore();
  const colors = getTheme(theme, userProfile.primaryColor);

  const isDark = theme === 'dark';
  const baseBg = elevated ? colors.glassSurfaceElevated : colors.glassSurface;

  const cardStyle: ViewStyle = {
    borderRadius,
    backgroundColor: baseBg,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    shadowColor: glowColor || colors.cardShadow,
    shadowOffset: { width: 0, height: glowColor ? 6 : 3 },
    shadowOpacity: glowColor ? (isDark ? 0.35 : 0.22) : (isDark ? 0.2 : 0.06),
    shadowRadius: glowColor ? 14 : 8,
    elevation: glowColor ? 5 : 2,
    overflow: 'hidden',
  };

  const content = (
    <View style={[styles.innerContainer, { borderRadius }]}>
      {/* Camada de Blur nativa em plataformas suportadas */}
      {Platform.OS === 'ios' && (
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Brilho especular sutil no topo simulando reflexo de cristal */}
      {hasSheen && (
        <LinearGradient
          colors={colors.gradients.glassSheen}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.sheenOverlay,
            { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius },
          ]}
          pointerEvents="none"
        />
      )}

      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        style={[cardStyle, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{content}</View>;
};

const styles = StyleSheet.create({
  innerContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  sheenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 38,
  },
});
