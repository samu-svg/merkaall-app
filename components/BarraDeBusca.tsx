import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';

import { Colors } from '@/constants/colors';

const SUGESTOES_RAPIDAS = ['celular', 'notebook', 'tv', 'tênis', 'fone', 'tablet', 'console', 'streaming'];

interface Props {
  value: string;
  onChangeText: (texto: string) => void;
  onCancel: () => void;
  carregando?: boolean;
  erro?: string | null;
  termosExpandidos?: string[];
  variant?: 'default' | 'header';
}

export function BarraDeBusca({
  value,
  onChangeText,
  onCancel,
  carregando = false,
  erro = null,
  termosExpandidos = [],
  variant = 'default',
}: Props) {
  const [ativa, setAtiva] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isHeader = variant === 'header';

  function handleLimpar() {
    onChangeText('');
    inputRef.current?.focus();
  }

  function handleCancelar() {
    onCancel();
    setAtiva(false);
    Keyboard.dismiss();
  }

  function handleSugestao(s: string) {
    onChangeText(s);
  }

  const emBusca = value.trim().length >= 2;
  const mostrarExpansao = ativa && emBusca && termosExpandidos.length > 1;
  const mostrarSugestoes = ativa && value.length === 0;

  return (
    <View style={[styles.container, isHeader && styles.containerHeader]}>
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
            placeholder={isHeader ? 'Buscar promoções' : 'Buscar promoções...'}
            placeholderTextColor={Colors.textTertiary}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setAtiva(true)}
            onBlur={() => setTimeout(() => setAtiva(false), 150)}
            returnKeyType="search"
            blurOnSubmit={false}
            autoCapitalize="none"
            autoCorrect={false}
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
        <View style={[styles.painel, isHeader && styles.painelHeader]}>
          <Text style={styles.labelSecao}>Categorias populares</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SUGESTOES_RAPIDAS.map((s) => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => handleSugestao(s)}>
                <Text style={styles.chipTexto}>{s}</Text>
              </TouchableOpacity>
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
  containerHeader: { flex: 1 },
  barraRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  barraRowHeader: { paddingVertical: 0, gap: 0 },
  inputWrapper: {
    flex: 1,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  inputWrapperAtivo: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  inputWrapperHeaderAtivo: { elevation: 2, shadowOpacity: 0.1 },
  icone: { fontSize: 16 },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary },
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
    zIndex: 20,
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
  chipTexto: { color: Colors.primaryText, fontSize: 14, fontWeight: '500' },
  erro: { color: Colors.danger, fontSize: 14, textAlign: 'center' },
});
