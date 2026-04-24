import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useDashboard() {
  const [stats, setStats] = useState({
    alunosAtivos: 0,
    novosMes: 0,
    inadimplentes: 0,
    semAvaliacao: 0,
    inativos15dias: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
      const quinzeDiasAtras = new Date(hoje.setDate(hoje.getDate() - 15)).toISOString().split('T')[0]

      const [ativos, novosMes, inadimplentes] = await Promise.all([
        supabase.from('alunos').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('alunos').select('id', { count: 'exact', head: true }).gte('created_at', inicioMes),
        supabase.from('cobrancas').select('id', { count: 'exact', head: true }).eq('status', 'atrasado'),
      ])

      // 1. Busca IDs de alunos que já têm avaliação aprovada
      const { data: comAvaliacao } = await supabase
        .from('avaliacoes_fisicas')
        .select('aluno_id')
        .eq('status', 'aprovada')

      const idsComAvaliacao = comAvaliacao?.map((a: any) => a.aluno_id) || []

      // 2. Conta alunos ativos que NÃO têm avaliação aprovada
      let semAvaliacaoCount = 0
      if (idsComAvaliacao.length === 0) {
        const { count } = await supabase
          .from('alunos')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ativo')
        semAvaliacaoCount = count || 0
      } else {
        const { count } = await supabase
          .from('alunos')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ativo')
          .not('id', 'in', `(${idsComAvaliacao.join(',')})`)
        semAvaliacaoCount = count || 0
      }

      setStats({
        alunosAtivos: ativos.count || 0,
        novosMes: novosMes.count || 0,
        inadimplentes: inadimplentes.count || 0,
        semAvaliacao: semAvaliacaoCount,
        inativos15dias: 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  return { stats, loading }
}
