import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Cobranca, FormaPagamento } from '@/types/database'

export function useCobrancas(alunoId?: string) {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let query = supabase
      .from('cobrancas')
      .select('*, aluno:alunos(nome)')
      .order('vencimento', { ascending: false })

    if (alunoId) {
      query = query.eq('aluno_id', alunoId)
    }

    query.then(({ data }) => {
      setCobrancas(data || [])
      setLoading(false)
    })
  }, [alunoId])

  async function registrarPagamento(id: string, forma: FormaPagamento) {
    const { data, error } = await supabase
      .from('cobrancas')
      .update({
        status: 'pago',
        pago_em: new Date().toISOString(),
        forma_pagamento: forma,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setCobrancas(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  return { cobrancas, loading, registrarPagamento }
}
