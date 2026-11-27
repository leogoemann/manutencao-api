import { useState } from 'react'
import { api } from '../api.js'
import { ManutencaoForm } from '../components/forms.jsx'
import Horimetro from '../components/Horimetro.jsx'
import { Button, Carregando, Drawer, ErroCarregamento, StatusBadge, Vazio } from '../components/ui.jsx'
import { horas } from '../format.js'
import { useCarregar } from '../hooks.js'

const FILTROS = [
  { valor: '', rotulo: 'Atrasadas e próximas' },
  { valor: 'atrasada', rotulo: 'Atrasadas' },
  { valor: 'proxima', rotulo: 'Próximas' },
  { valor: 'em_dia', rotulo: 'Em dia' },
]

export default function Alertas({ aoMudar }) {
  const [filtro, setFiltro] = useState('')
  const carga = useCarregar(async () => {
    const [alertas, maquinas] = await Promise.all([api.listarAlertas(filtro), api.listarMaquinas()])
    return { alertas, maquinas: Object.fromEntries(maquinas.map((m) => [m.id, m])) }
  }, [filtro])
  const [selecionada, setSelecionada] = useState(null)

  const fechar = () => setSelecionada(null)
  const aposSalvar = () => {
    fechar()
    carga.recarregar()
    aoMudar()
  }

  return (
    <div className="pagina">
      <header className="pagina-topo">
        <div>
          <h1>Alertas de manutenção</h1>
          <p className="muted">Calculados a cada consulta a partir das horas desde a última preventiva.</p>
        </div>
      </header>

      <div className="chips" role="group" aria-label="Filtrar alertas">
        {FILTROS.map((f) => (
          <button key={f.valor || 'padrao'} type="button" className={`chip${filtro === f.valor ? ' ativo' : ''}`} aria-pressed={filtro === f.valor} onClick={() => setFiltro(f.valor)}>
            {f.rotulo}
          </button>
        ))}
      </div>

      {carga.carregando && !carga.dados && <Carregando />}
      {carga.erro && <ErroCarregamento erro={carga.erro} onTentar={carga.recarregar} />}
      {carga.dados && carga.dados.alertas.length === 0 && (
        <Vazio
          titulo={filtro === 'em_dia' ? 'Nenhuma máquina em dia' : 'Nenhum alerta ativo'}
          texto={filtro === 'em_dia' ? 'Todas as máquinas precisam de atenção.' : 'Nenhuma máquina está a menos de 10% do intervalo da preventiva.'}
        />
      )}

      {carga.dados && carga.dados.alertas.length > 0 && (
        <ul className="alertas">
          {carga.dados.alertas.map((a) => {
            const maquina = carga.dados.maquinas[a.maquina_id]
            return (
              <li key={a.maquina_id} className={`alerta alerta-${a.status}`}>
                <div className="alerta-cabeca">
                  <StatusBadge status={a.status} />
                  <p className="alerta-msg">{a.mensagem}</p>
                </div>
                <div className="alerta-corpo">
                  <div>
                    <a href={`#/maquinas/${a.maquina_id}`} className="frota-nome">{a.maquina_nome}</a>
                    <p className="muted pequeno">{a.maquina_codigo}, {horas(a.horas_desde_ultima_manutencao)} desde a última preventiva</p>
                  </div>
                  {maquina && <Horimetro horasDesde={a.horas_desde_ultima_manutencao} intervalo={maquina.intervalo_manutencao_horas} status={a.status} />}
                </div>
                {a.status !== 'em_dia' && maquina && (
                  <div className="alerta-acoes">
                    <Button variant="ghost" onClick={() => setSelecionada(maquina)}>Registrar preventiva</Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Drawer aberto={Boolean(selecionada)} titulo="Registrar preventiva" descricao={selecionada ? `${selecionada.nome} (${selecionada.codigo})` : ''} onFechar={fechar}>
        {selecionada && <ManutencaoForm maquinaFixa={selecionada} tipoInicial="preventiva" onSalvo={aposSalvar} onCancelar={fechar} />}
      </Drawer>
    </div>
  )
}
