import React, { useState, useRef } from 'react';
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

import { useBuscaInteligente } from '@/hooks/useBuscaInteligente';
import { fmtBRL } from '@/lib/format';
import { LojaBadge } from '@/components/LojaBadge';
import type { Promocao } from '@/lib/types';
import { Colors } from '@/constants/colors';

const SUGESTOES_RAPIDAS = ['celular', 'notebook', 'tv', 'tênis', 'fone', 'tablet', 'console', 'streaming'];

interface Props {
  onSelecionarPromocao: (p: Promocao) => void;
}

export function BarraDeBusca({ onSelecionarPromocao }: Props) {
  const [texto, setTexto] = useState('');
  const [ativa, setAtiva] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { promocoes, carregando, erro, termosExpandidos, totalEncontrado, buscar, limpar } = useBuscaInteligente();

  function handleTexto(valor: string) {
    setTexto(valor);
    buscar(valor);
  }

  function handleLimpar() {
    setTexto('');
    limpar();
    inputRef.current?.focus();
  }

  function handleCancelar() {
    setTexto('');
    limpar();
    setAtiva(false);
    Keyboard.dismiss();
  }

  function handleSugestao(s: string) {
    setTexto(s);
    buscar(s);
  }

  const mostrarResultados = ativa && texto.length >= 2;
  const mostrarSugestoes = ativa && texto.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.barraRow}>
        <View style={[styles.inputWrapper, ativa && styles.inputWrapperAtivo]}>
          <Text style={styles.icone}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Buscar promoções..."
            placeholderTextColor={Colors.textTertiary}
            value={texto}
            onChangeText={handleTexto}
            onFocus={() => setAtiva(true)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {carregando && <ActivityIndicator size="small" color={Colors.primary} />}
          {texto.length > 0 && !carregando && (
            <TouchableOpacity onPress={handleLimpar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.botaoLimpar}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {ativa && (
          <TouchableOpacity onPress={handleCancelar} style={styles.botaoCancelar}>
            <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>

      {mostrarSugestoes && (
        <View style={styles.painel}>
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

      {mostrarResultados && termosExpandidos.length > 1 && (
        <View style={styles.expansao}>
          <Text style={styles.expansaoTexto}>
            Buscando também: {termosExpandidos.slice(1, 5).join(', ')}
            {termosExpandidos.length > 5 ? '…' : ''}
          </Text>
        </View>
      )}

      {erro && (
        <View style={styles.painel}>
          <Text style={styles.erro}>{erro}</Text>
        </View>
      )}

      {mostrarResultados && !carregando && (
        <View style={styles.painel}>
          {totalEncontrado === 0 ? (
            <View style={styles.semResultados}>
              <Text style={styles.semResultadosIcone}>🔎</Text>
              <Text style={styles.semResultadosTexto}>Nenhuma promoção encontrada para "{texto}"</Text>
              <Text style={styles.semResultadosDica}>Tente termos mais gerais como "celular" ou "tv"</Text>
            </View>
          ) : (
            <>
              <Text style={styles.labelSecao}>{totalEncontrado} promoções encontradas</Text>
              <ScrollView keyboardShouldPersistTaps="handled" style={styles.lista} showsVerticalScrollIndicator={false}>
                {promocoes.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.itemResultado}
                    onPress={() => {
                      onSelecionarPromocao(p);
                      handleCancelar();
                    }}
                  >
                    <View style={styles.itemConteudo}>
                      <Text style={styles.itemTitulo} numberOfLines={2}>
                        {p.titulo}
                      </Text>
                      <View style={styles.itemRodape}>
                        <LojaBadge promo={p} compact />
                        {p.categoria ? <Text style={styles.itemCategoria}>{p.categoria}</Text> : null}
                        <Text style={styles.itemPreco}>{fmtBRL.format(p.preco_desconto)}</Text>
                      </View>
                    </View>
                    <Text style={styles.itemSeta}>›</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 100 },
  barraRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
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
  inputWrapperAtivo: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  icone: { fontSize: 16 },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary },
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
  lista: { maxHeight: 400 },
  itemResultado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemConteudo: { flex: 1, gap: 4 },
  itemTitulo: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  itemRodape: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemCategoria: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemPreco: { fontSize: 14, fontWeight: '700', color: Colors.success },
  itemSeta: { fontSize: 22, color: Colors.textTertiary, marginLeft: 8 },
  semResultados: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  semResultadosIcone: { fontSize: 36 },
  semResultadosTexto: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary, textAlign: 'center' },
  semResultadosDica: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center' },
  erro: { color: Colors.danger, fontSize: 14, textAlign: 'center' },
});
