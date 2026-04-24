import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Aluno } from '@/types/database'

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAlunos()
  }, [])

  async function fetchAlunos() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('alunos')
        .select('*, plano:planos(*)')
        .order('nome')

      if (error) throw error
      setAlunos(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function criarAluno(novoAluno: Omit<Aluno, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('alunos')
      .insert(novoAluno)
      .select('*, plano:planos(*)')
      .single()

    if (error) {
      console.error('Erro Supabase (criarAluno):', error)
      throw error
    }
    setAlunos(prev => [...prev, data])
    return data
  }

  async function atualizarAluno(id: string, updates: Partial<Aluno>) {
    const { data, error } = await supabase
      .from('alunos')
      .update(updates)
      .eq('id', id)
      .select('*, plano:planos(*)')
      .single()

    if (error) throw error
    setAlunos(prev => prev.map(a => a.id === id ? data : a))
    return data
  }

  return { alunos, loading, error, fetchAlunos, criarAluno, atualizarAluno }
}
