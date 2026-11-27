import { useState } from 'react'
import { api } from '../api.js'
import { ManutencaoForm } from '../components/forms.jsx'
import { Carregando, ErroCarregamento, Vazio } from '../components/ui.jsx'
import { data, horas, moeda, TIPOS_MANUTENCAO } from '../format.js'
import { useCarregar } from '../hooks.js'

export default function Manutencoes({ aoMudar }) {
  const [chave, setChave] = useState(0)
  const [tipo, setTipo] = useState('')
  const carga = useCarregar(async () => {
    const maquinas = await api.listarMaquinas()
    const listas = await Promise.all(maquinas.map((m) => api.listarManutencoes(m.id).then((l) => l.map((mt) => ({ ...mt, maquina: m })))))
    const historico = listas.flat().sort((a, b) => (a.data === b.data ? b.id - a.id : b.data.localeCompare(a.data)))
    return { maquinas, historico }
  })

  const historico = (carga.dados?.historico || []).filter((mt) => !tipo || mt.tipo === tipo)
  const custoTotal = historico.reduce((soma, mt) => soma + (mt.custo || 0), 0)

  return (
    <div className="pagina">
      <header className="pagina-topo">
        <div>
          <h1>Manutenções</h1>
          <p className="muted">Registre intervenções e consulte o histórico de toda a frota.</p>
        </div>
      </header>
      {carga.carregando && !carga.dados && <Carregando />}
      {carga.erro && <ErroCarregamento erro={carga.erro} onTentar={carga.recarregar} />}
      {carga.dados && carga.dados.maquinas.length === 0 && (
        <Vazio titulo="Nenhuma máquina cadastrada" texto="Cadastre uma máquina antes de registrar manutenções.">
          <a className="btn btn-primary" href="#/maquinas">Ir para máquinas</a>
        </Vazio>
      )}
      {carga.dados && carga.dados.maquinas.length > 0 && (
        <div className="duas-colunas">
          <section className="cartao" aria-labelledby="registrar-titulo">
            <h2 id="registrar-titulo">Registrar manutenção</h2>
            <ManutencaoForm
              key={chave}
              maquinas={carga.dados.maquinas}
              onSalvo={() => {
                setChave((c) => c + 1)
                carga.recarregar()
                aoMudar()
              }}
            />
          </section>
          <section className="cartao" aria-labelledby="historico-titulo">
            <div className="secao-topo">
              <h2 id="historico-titulo">Histórico</h2>
              <label className="seletor-compacto">
                <span className="sr-only">Filtrar por tipo</span>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="">Todos os tipos</option>
                  {Object.entries(TIPOS_MANUTENCAO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
                </select>
              </label>
            </div>
            <p className="muted pequeno">{historico.length} registros, {moeda(custoTotal)} em custos</p>
            {historico.length === 0 ? (
              <Vazio titulo="Nenhuma manutenção registrada" texto="As manutenções registradas aparecem aqui em ordem de data." />
            ) : (
              <ol className="linha-tempo">
                {historico.map((mt) => (
                  <li key={mt.id} className={`evento evento-${mt.tipo}`}>
                    <div className="evento-topo">
                      <strong>{TIPOS_MANUTENCAO[mt.tipo]} em <a href={`#/maquinas/${mt.maquina.id}`}>{mt.maquina.nome}</a></strong>
                      <span className="muted tabular">{data(mt.data)}</span>
                    </div>
                    {mt.descricao && <p>{mt.descricao}</p>}
                    <p className="muted pequeno">
                      {[`horímetro ${horas(mt.horas_maquina)}`, mt.responsavel, mt.custo != null ? moeda(mt.custo) : null].filter(Boolean).join(', ')}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
