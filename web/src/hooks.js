import { useCallback, useEffect, useRef, useState } from 'react'

export function useCarregar(carregar, dependencias = []) {
  const carregarRef = useRef(carregar)
  const [versao, setVersao] = useState(0)
  const [estado, setEstado] = useState({ chave: null, dados: null, erro: null })
  const chave = `${versao}|${JSON.stringify(dependencias)}`
  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  useEffect(() => {
    carregarRef.current = carregar
  })

  useEffect(() => {
    let ativo = true
    carregarRef.current()
      .then((dados) => ativo && setEstado({ chave, dados, erro: null }))
      .catch((e) => ativo && setEstado({ chave, dados: null, erro: e.message }))
    return () => {
      ativo = false
    }
  }, [chave])

  return { dados: estado.dados, erro: estado.erro, carregando: estado.chave !== chave, recarregar }
}

export function useRota() {
  const ler = () => window.location.hash.replace(/^#/, '') || '/painel'
  const [rota, setRota] = useState(ler)
  useEffect(() => {
    const aoMudar = () => {
      setRota(ler())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])
  return rota
}

export const navegar = (caminho) => {
  window.location.hash = caminho
}
