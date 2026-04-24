import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plano } from '@/types/database'

export function usePlanos() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('planos')
      .select('*')
      .eq('ativo', true)
      .order('valor')
      .then(({ data }) => {
        setPlanos(data || [])
        setLoading(false)
      })
  }, [])

  return { planos, loading }
}
