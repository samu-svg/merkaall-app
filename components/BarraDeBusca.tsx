import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';

import { Colors } from '@/constants/colors';

const SUGESTOES_RAPIDAS = ['celular', 'notebook', 'tv', 'tênis', 'fone', 'tablet', 'console', 'streaming'];

function preventWebBlur(e: { preventDefault?: () => void }) {
  e.preventDefault?.();
}

interface Props {
  value: string;
  onChangeText: (texto: string) => void;
  onCancel: () => void;
  carregando?: boolean;
  erro?: string | null;
  termosExpandidos?: string[];
  variant?: 'default' | 'header';
  /** Header compacto: mais espaço horizontal para o termo digitado. */
  onCompactChange?: (compacto: boolean) => void;
  onAtivaChange?: (ativa: boolean) => void;
}

export function BarraDeBusca({
  value,
  onChangeText,
  onCancel,
  carregando = false,
  erro = null,
  termosExpandidos = [],
  variant = 'default',
  onCompactChange,
  onAtivaChange,
}: Props) {
  const [ativa, setAtiva] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selecionandoRef = useRef(false);
  const isHeader = variant === 'header';
  const compacto = value.trim().length > 0;

  useEffect(() => {
    onCompactChange?.(compacto);
  }, [compacto, onCompactChange]);

  useEffect(() => {
    onAtivaChange?.(ativa);
  }, [ativa, onAtivaChange]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  function cancelarBlur() {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }

  function handleFocus() {
    cancelarBlur();
    setAtiva(true);
  }

  function handleBlur() {
    cancelarBlur();
    blurTimeoutRef.current = setTimeout(() => {
      if (!selecionandoRef.current) setAtiva(false);
    }, 250);
  }

  function handleLimpar() {
    onChangeText('');
    inputRef.current?.focus();
  }

  function handleCancelar() {
    cancelarBlur();
    selecionandoRef.current = false;
    onCancel();
    setAtiva(false);
    Keyboard.dismiss();
  }

  function handleSugestao(s: string) {
    cancelarBlur();
    selecionandoRef.current = true;
    onChangeText(s);
    setAtiva(false);
    Keyboard.dismiss();
    requestAnimationFrame(() => {
      selecionandoRef.current = false;
    });
  }

  const emBusca = value.trim().length >= 2;
  const mostrarExpansao = ativa && emBusca && termosExpandidos.length > 1;
  const mostrarSugestoes = ativa && value.length === 0;
  const webFocusProps = Platform.OS === 'web' ? { onMouseDown: preventWebBlur } : {};

  return (
    <View style={[styles.container, isHeader && styles.containerHeader, mostrarSugestoes && styles.containerPainelAberto]}>
      <View style={[styles.barraRow, isHeader && styles.barraRowHeader]}>
        <View
          style={[
            styles.inputWrapper,
            isHeader && styles.inputWrapperHeader,
            ativa && !isHeader && styles.inputWrapperAtivo,
            ativa && isHeader && styles.inputWrapperHeaderAtivo,
          ]}
        >
          <Text style={styles.icone}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={[styles.input, isHeader && styles.inputHeader]}
            placeholder={isHeader ? 'Buscar...' : 'Buscar promoções...'}
            placeholderTextColor={Colors.textTertiary}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            returnKeyType="search"
            blurOnSubmit={false}
            autoCapitalize="none"
            autoCorrect={false}
            {...(Platform.OS === 'android'
              ? { includeFontPadding: false, textAlignVertical: 'center' as const }
              : {})}
          />
          {carregando && <ActivityIndicator size="small" color={Colors.primary} />}
          {value.length > 0 && !carregando && (
            <TouchableOpacity onPress={handleLimpar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.botaoLimpar}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {ativa && !isHeader && (
          <TouchableOpacity onPress={handleCancelar} style={styles.botaoCancelar}>
            <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>

      {mostrarSugestoes && (
        <View
          style={[styles.painel, isHeader && styles.painelHeader]}
          onTouchStart={() => {
            selecionandoRef.current = true;
            cancelarBlur();
          }}
          onTouchEnd={() => {
            requestAnimationFrame(() => {
              selecionandoRef.current = false;
            });
          }}
          {...(webFocusProps as Record<string, unknown>)}
        >
          <Text style={styles.labelSecao}>Categorias populares</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
          >
            {SUGESTOES_RAPIDAS.map((s) => (
              <Pressable
                key={s}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                onPressIn={() => {
                  selecionandoRef.current = true;
                  cancelarBlur();
                }}
                onPress={() => handleSugestao(s)}
                accessibilityRole="button"
                accessibilityLabel={`Buscar ${s}`}
                {...webFocusProps}
              >
                <Text style={styles.chipTexto}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {mostrarExpansao && (
        <View style={styles.expansao}>
          <Text style={styles.expansaoTexto}>
            Buscando também: {termosExpandidos.slice(1, 5).join(', ')}
            {termosExpandidos.length > 5 ? '…' : ''}
          </Text>
        </View>
      )}

      {erro ? (
        <View style={[styles.painel, isHeader && styles.painelHeader]}>
          <Text style={styles.erro}>{erro}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 10 },
  containerHeader: { flex: 1, overflow: 'visible' },
  containerPainelAberto: { zIndex: 40, elevation: 16 },
  barraRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  barraRowHeader: { paddingVertical: 0, gap: 0 },
  inputWrapper: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputWrapperHeader: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'android' ? 6 : 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  inputWrapperAtivo: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  inputWrapperHeaderAtivo: { elevation: 2, shadowOpacity: 0.1 },
  icone: { fontSize: 16, flexShrink: 0 },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: Platform.OS === 'android' ? 0 : undefined,
  },
  inputHeader: { fontSize: 15 },
  botaoLimpar: { fontSize: 14, color: Colors.textTertiary, fontWeight: '600' },
  botaoCancelar: { paddingVertical: 6 },
  botaoCancelarTexto: { color: Colors.primary, fontSize: 15, fontWeight: '500' },
  expansao: { marginBottom: 4 },
  expansaoTexto: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic' },
  painel: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  painelHeader: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    marginBottom: 0,
    zIndex: 50,
    elevation: 20,
  },
  labelSecao: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  chipPressed: { opacity: 0.75 },
  chipTexto: { color: Colors.primaryText, fontSize: 14, fontWeight: '500' },
  erro: { color: Colors.danger, fontSize: 14, textAlign: 'center' },
});
