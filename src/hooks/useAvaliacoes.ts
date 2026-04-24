import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AvaliacaoFisica } from '@/types/database'

export function useAvaliacoes(alunoId?: string) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFisica[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let query = supabase
      .from('avaliacoes_fisicas')
      .select('*')
      .order('data_avaliacao', { ascending: false })

    if (alunoId) {
      query = query.eq('aluno_id', alunoId)
    }

    query.then(({ data }) => {
      setAvaliacoes(data || [])
      setLoading(false)
    })
  }, [alunoId])

  async function criarAvaliacao(avaliacao: Partial<AvaliacaoFisica>) {
    const { data, error } = await supabase
      .from('avaliacoes_fisicas')
      .insert(avaliacao)
      .select()
      .single()

    if (error) throw error
    setAvaliacoes(prev => [data, ...prev])
    return data
  }

  async function aprovarAvaliacao(id: string, cref: string, nivel: string, parecer: string) {
    const { data, error } = await supabase
      .from('avaliacoes_fisicas')
      .update({
        status: 'aprovada',
        cref,
        nivel_condicionamento: nivel,
        parecer,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setAvaliacoes(prev => prev.map(a => a.id === id ? data : a))
    return data
  }

  return { avaliacoes, loading, criarAvaliacao, aprovarAvaliacao }
}
