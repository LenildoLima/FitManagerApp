import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useFichasTreino(alunoId?: string) {
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFichas = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('fichas_treino')
        .select(`
          *,
          divisoes:divisoes_treino (
            *,
            itens:itens_treino (
              *,
              exercicio:exercicios (*)
            )
          )
        `)
        .eq('status', 'ativa');

      if (alunoId) {
        query = query.eq('aluno_id', alunoId);
      }

      const { data, error: fbError } = await query;

      if (fbError) throw fbError;
      setFichas(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [alunoId]);

  useEffect(() => {
    fetchFichas();
  }, [fetchFichas]);

  return { fichas, loading, error, refresh: fetchFichas };
}
