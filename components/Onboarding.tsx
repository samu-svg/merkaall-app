import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronRight } from 'lucide-react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { CategoryPicker, isCategorySelectionValid } from '@/components/CategoryPicker';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { seedCategoryPreferences } from '@/lib/feedPrefs';
import { requestNotificationPermission } from '@/lib/notifications';
import { registerPushToken } from '@/lib/push';
import { getEffectiveUserId } from '@/lib/userId';
import {
  FEED_CATEGORIAS_MAX,
  FEED_CATEGORIAS_ONBOARDING_MIN,
  useFeedPrefsStore,
} from '@/store/useFeedPrefsStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';

type Props = {
  visible: boolean;
  onComplete: () => void;
};

export function Onboarding({ visible, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const setPermissionGranted = useNotificationsStore((s) => s.setPermissionGranted);
  const setCategorias = useFeedPrefsStore((s) => s.setCategorias);

  const avancarCategorias = useCallback(async () => {
    if (!isCategorySelectionValid(selecionadas, FEED_CATEGORIAS_ONBOARDING_MIN, FEED_CATEGORIAS_MAX)) {
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cats = [...selecionadas];
    await setCategorias(cats);
    await seedCategoryPreferences(cats);
    setStep(2);
  }, [selecionadas, setCategorias]);

  const ativarNotificacoes = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      const userId = await getEffectiveUserId();
      void registerPushToken(userId);
    }
    onComplete();
  }, [onComplete, setPermissionGranted]);

  const pularNotificacoes = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  }, [onComplete]);

  const podeAvancarCategorias = isCategorySelectionValid(
    selecionadas,
    FEED_CATEGORIAS_ONBOARDING_MIN,
    FEED_CATEGORIAS_MAX,
  );

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {step === 0 && (
          <View style={styles.step}>
            <View style={styles.hero}>
              <BrandLogo variant="horizontal" size={48} />
              <Text style={styles.titulo}>Bem-vindo ao Merkaall</Text>
              <Text style={styles.subtitulo}>
                Encontre as melhores promoções e receba alertas quando o preço cair.
              </Text>
            </View>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep(1);
              }}
              accessibilityRole="button"
              accessibilityLabel="Começar onboarding"
            >
              <Text style={styles.primaryBtnText}>Começar</Text>
              <ChevronRight size={20} color="#fff" />
            </Pressable>
          </View>
        )}

        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.titulo}>O que você curte?</Text>
            <Text style={styles.subtitulo}>
              Escolha de {FEED_CATEGORIAS_ONBOARDING_MIN} a {FEED_CATEGORIAS_MAX} categorias para
              personalizar seu feed.
            </Text>
            <CategoryPicker
              selecionadas={selecionadas}
              onChange={setSelecionadas}
              min={FEED_CATEGORIAS_ONBOARDING_MIN}
              max={FEED_CATEGORIAS_MAX}
            />
            <Pressable
              style={[styles.primaryBtn, !podeAvancarCategorias && styles.btnDisabled]}
              onPress={() => void avancarCategorias()}
              disabled={!podeAvancarCategorias}
              accessibilityRole="button"
              accessibilityLabel="Continuar para notificações"
              accessibilityState={{ disabled: !podeAvancarCategorias }}
            >
              <Text style={styles.primaryBtnText}>Continuar</Text>
              <ChevronRight size={20} color="#fff" />
            </Pressable>
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <View style={styles.notifIcon}>
              <Bell size={40} color={Colors.primary} />
            </View>
            <Text style={styles.titulo}>Avise quando o preço cair</Text>
            <Text style={styles.subtitulo}>
              Ative notificações para receber alertas de queda de preço e ofertas nas categorias que
              você escolheu.
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => void ativarNotificacoes()}
              accessibilityRole="button"
              accessibilityLabel="Ativar notificações"
            >
              <Text style={styles.primaryBtnText}>Ativar notificações</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={pularNotificacoes}
              accessibilityRole="button"
              accessibilityLabel="Pular notificações por enquanto"
            >
              <Text style={styles.secondaryBtnText}>Agora não</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  step: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingTop: Spacing.xxxl,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  notifIcon: {
    alignSelf: 'center',
    marginTop: Spacing.xxxl * 2,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
