import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LegalLinks } from '@/components/LegalLinks';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { MIN_PASSWORD_LENGTH, validatePasswordStrength } from '@/lib/password';
import { useAuthStore } from '@/store/useAuthStore';

type AuthMode = 'login' | 'cadastro';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AuthModal({ visible, onClose }: Props) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    if (!visible) {
      setMode('login');
      setNome('');
      setEmail('');
      setSenha('');
      setMensagem(null);
      setAceitouTermos(false);
      clearError();
    }
  }, [visible, clearError]);

  function trocarModo(next: AuthMode) {
    setMode(next);
    setMensagem(null);
    clearError();
  }

  async function handleSubmit() {
    setMensagem(null);
    clearError();

    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim || !senha) {
      setMensagem('Preencha e-mail e senha.');
      return;
    }

    if (mode === 'cadastro') {
      const nomeTrim = nome.trim();
      if (!nomeTrim) {
        setMensagem('Informe seu nome.');
        return;
      }
      if (!aceitouTermos) {
        setMensagem('Aceite a Política de Privacidade e os Termos de Uso para continuar.');
        return;
      }
      const senhaErro = validatePasswordStrength(senha);
      if (senhaErro) {
        setMensagem(senhaErro);
        return;
      }
      const result = await signUp(emailTrim, senha, nomeTrim);
      if (!result.ok) return;
      if (result.needsConfirmation) {
        setMensagem(
          'Conta criada! Abra o e-mail e toque no link para confirmar. Depois volte ao app e entre com e-mail e senha.',
        );
        return;
      }
      onClose();
      return;
    }

    const ok = await signIn(emailTrim, senha);
    if (ok) onClose();
  }

  const titulo = mode === 'login' ? 'Entrar na conta' : 'Criar conta';
  const botao = mode === 'login' ? 'Entrar' : 'Cadastrar';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>{titulo}</Text>
          <Text style={styles.subtitle}>
            Login opcional — você pode usar o app sem conta.
          </Text>

          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => trocarModo('login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                Entrar
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === 'cadastro' && styles.tabActive]}
              onPress={() => trocarModo('cadastro')}
            >
              <Text style={[styles.tabText, mode === 'cadastro' && styles.tabTextActive]}>
                Cadastrar
              </Text>
            </Pressable>
          </View>

          {mode === 'cadastro' && (
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor={Colors.textTertiary}
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              editable={!isLoading}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor={Colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder={`Senha (mín. ${MIN_PASSWORD_LENGTH} caracteres)`}
            placeholderTextColor={Colors.textTertiary}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            editable={!isLoading}
          />

          {mode === 'cadastro' && (
            <Pressable
              style={styles.termsRow}
              onPress={() => setAceitouTermos((v) => !v)}
              disabled={isLoading}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: aceitouTermos }}
              accessibilityLabel="Aceito a Política de Privacidade e os Termos de Uso"
            >
              <View style={[styles.checkbox, aceitouTermos && styles.checkboxChecked]}>
                {aceitouTermos ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.termsText}>
                Li e aceito a <Text style={styles.termsEmphasis}>Política de Privacidade</Text> e os{' '}
                <Text style={styles.termsEmphasis}>Termos de Uso</Text>.
              </Text>
            </Pressable>
          )}

          {mode === 'cadastro' && <LegalLinks variant="inline" />}

          {(error || mensagem) && (
            <Text style={[styles.feedback, mensagem ? styles.feedbackInfo : styles.feedbackError]}>
              {mensagem ?? error}
            </Text>
          )}

          <Pressable
            style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
            onPress={() => void handleSubmit()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.primaryBtnText}>{botao}</Text>
            )}
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={onClose} disabled={isLoading}>
            <Text style={styles.secondaryBtnText}>Continuar sem login</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.cardLg,
    borderTopRightRadius: Radius.cardLg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radius.button,
    padding: 4,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.button - 2,
  },
  tabActive: {
    backgroundColor: Colors.surface,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  feedback: {
    fontSize: 13,
    lineHeight: 18,
  },
  feedbackError: {
    color: Colors.danger,
  },
  feedbackInfo: {
    color: Colors.primaryText,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  termsEmphasis: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
