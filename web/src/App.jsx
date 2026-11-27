import { useEffect, useState } from 'react'
import { api } from './api.js'
import { ToastProvider } from './components/ui.jsx'
import { useRota } from './hooks.js'
import Alertas from './pages/Alertas.jsx'
import ApontarHoras from './pages/ApontarHoras.jsx'
import MaquinaDetalhe from './pages/MaquinaDetalhe.jsx'
import Maquinas from './pages/Maquinas.jsx'
import Manutencoes from './pages/Manutencoes.jsx'
import Painel from './pages/Painel.jsx'

const MENU = [
  { caminho: '/painel', rotulo: 'Painel', icone: 'M4 13h6V4H4v9zm10 7h6V4h-6v16zM4 20h6v-4H4v4z' },
  { caminho: '/maquinas', rotulo: 'Máquinas', icone: 'M3 20h18M5 20V9l5 3V9l5 3V6l4 2v12' },
  { caminho: '/horas', rotulo: 'Apontar horas', icone: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  { caminho: '/manutencoes', rotulo: 'Manutenções', icone: 'M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8V20h3.2l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.3-.6-.6-2.3 2.4-2.6z' },
  { caminho: '/alertas', rotulo: 'Alertas', icone: 'M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z' },
]

function Icone({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Pagina({ rota, contadorAlertas }) {
  const detalhe = rota.match(/^\/maquinas\/(\d+)$/)
  if (detalhe) return <MaquinaDetalhe id={detalhe[1]} aoMudar={contadorAlertas.atualizar} />
  switch (rota.split('?')[0]) {
    case '/maquinas': return <Maquinas aoMudar={contadorAlertas.atualizar} />
    case '/horas': return <ApontarHoras aoMudar={contadorAlertas.atualizar} />
    case '/manutencoes': return <Manutencoes aoMudar={contadorAlertas.atualizar} />
    case '/alertas': return <Alertas aoMudar={contadorAlertas.atualizar} />
    default: return <Painel />
  }
}

export default function App() {
  const rota = useRota()
  const [menuAberto, setMenuAberto] = useState(false)
  const [alertas, setAlertas] = useState({ atrasada: 0, proxima: 0 })
  const [versaoAlertas, setVersaoAlertas] = useState(0)

  useEffect(() => {
    api.listarAlertas()
      .then((lista) => setAlertas({
        atrasada: lista.filter((a) => a.status === 'atrasada').length,
        proxima: lista.filter((a) => a.status === 'proxima').length,
      }))
      .catch(() => setAlertas({ atrasada: 0, proxima: 0 }))
  }, [rota, versaoAlertas])

  const ativo = (caminho) => rota === caminho || rota.startsWith(`${caminho}/`)
  const totalAlertas = alertas.atrasada + alertas.proxima

  return (
    <ToastProvider>
      <a className="pular" href="#conteudo">Pular para o conteúdo</a>
      <div className="app">
        <header className="barra-movel">
          <a className="marca" href="#/painel">
            <img src="/favicon.svg" alt="" width="28" height="28" />
            <span>Horímetro</span>
          </a>
          <button type="button" className="icone-btn" aria-expanded={menuAberto} aria-controls="menu-principal" onClick={() => setMenuAberto((v) => !v)}>
            <span className="sr-only">Abrir menu</span>
            <Icone d="M4 7h16M4 12h16M4 17h16" />
          </button>
        </header>
        <nav id="menu-principal" className={`lateral${menuAberto ? ' aberto' : ''}`} aria-label="Menu principal">
          <a className="marca" href="#/painel">
            <img src="/favicon.svg" alt="" width="30" height="30" />
            <span>
              Horímetro
              <small>Manutenção preventiva</small>
            </span>
          </a>
          <ul>
            {MENU.map((item) => (
              <li key={item.caminho}>
                <a href={`#${item.caminho}`} onClick={() => setMenuAberto(false)} className={ativo(item.caminho) ? 'ativo' : ''} aria-current={ativo(item.caminho) ? 'page' : undefined}>
                  <Icone d={item.icone} />
                  <span>{item.rotulo}</span>
                  {item.caminho === '/alertas' && totalAlertas > 0 && (
                    <span className={`contador ${alertas.atrasada ? 'contador-late' : 'contador-warn'}`} aria-label={`${totalAlertas} alertas`}>
                      {totalAlertas}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
          <div className="lateral-rodape">
            <p className="muted pequeno">API</p>
            <p className="pequeno quebra">{api.baseUrl}</p>
          </div>
        </nav>
        <main id="conteudo" className="conteudo" tabIndex="-1">
          <Pagina rota={rota} contadorAlertas={{ atualizar: () => setVersaoAlertas((v) => v + 1) }} />
        </main>
      </div>
    </ToastProvider>
  )
}
