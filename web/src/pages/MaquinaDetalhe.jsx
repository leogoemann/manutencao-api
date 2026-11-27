import { useState } from 'react'
import { api } from '../api.js'
import { MaquinaForm, ManutencaoForm, UsoForm } from '../components/forms.jsx'
import Horimetro from '../components/Horimetro.jsx'
import { Button, Carregando, Confirmacao, Drawer, ErroCarregamento, StatusBadge, Vazio } from '../components/ui.jsx'
import { useToast } from '../components/toast.js'
import { data, horas, mensagemStatus, moeda, TIPOS_MANUTENCAO } from '../format.js'
import { navegar, useCarregar } from '../hooks.js'

export default function MaquinaDetalhe({ id, aoMudar }) {
  const avisar = useToast()
  const carga = useCarregar(async () => {
    const [maquina, usos, manutencoes] = await Promise.all([
      api.buscarMaquina(id),
      api.listarRegistrosUso(id),
      api.listarManutencoes(id),
    ])
    return { maquina, usos, manutencoes }
  }, [id])
  const [aba, setAba] = useState('manutencoes')
  const [painel, setPainel] = useState(null)
  const [excluindo, setExcluindo] = useState(false)

  if (carga.carregando && !carga.dados) return <Carregando />
  if (carga.erro) {
    return (
      <div className="pagina">
        <a className="voltar" href="#/maquinas">Voltar para máquinas</a>
        <ErroCarregamento erro={carga.erro} onTentar={carga.recarregar} />
      </div>
    )
  }

  const { maquina: m, usos, manutencoes } = carga.dados
  const fechar = () => setPainel(null)
  const aposSalvar = () => {
    fechar()
    carga.recarregar()
    aoMudar()
  }

  async function excluir() {
    setExcluindo(true)
    try {
      await api.excluirMaquina(m.id)
      avisar(`Máquina ${m.codigo} excluída com seu histórico.`)
      aoMudar()
      navegar('/maquinas')
    } catch (e) {
      avisar(e.message, 'erro')
      setExcluindo(false)
    }
  }

  const fatos = [
    ['Fabricante', m.fabricante || '—'],
    ['Modelo', m.modelo || '—'],
    ['Localização', m.localizacao || '—'],
    ['Aquisição', data(m.data_aquisicao)],
    ['Horímetro total', horas(m.horas_uso_total)],
    ['Intervalo da preventiva', horas(m.intervalo_manutencao_horas)],
    ['Última preventiva', data(m.ultima_manutencao_em)],
  ]

  return (
    <div className="pagina">
      <a className="voltar" href="#/maquinas">Voltar para máquinas</a>
      <header className="pagina-topo">
        <div>
          <p className="codigo-maquina">{m.codigo}</p>
          <h1>{m.nome}</h1>
        </div>
        <div className="acoes-topo">
          <Button variant="ghost" onClick={() => setPainel('editar')}>Editar</Button>
          <Button variant="ghost" className="btn-perigo-texto" onClick={() => setPainel('excluir')}>Excluir</Button>
        </div>
      </header>

      <section className={`painel-status painel-${m.status_manutencao}`} aria-labelledby="situacao-titulo">
        <div className="painel-status-topo">
          <div>
            <h2 id="situacao-titulo" className="sr-only">Situação da preventiva</h2>
            <StatusBadge status={m.status_manutencao} />
            <p className="painel-status-msg">{mensagemStatus(m)}</p>
          </div>
          <div className="acoes-topo">
            <Button variant="ghost" onClick={() => setPainel('uso')}>Apontar horas</Button>
            <Button onClick={() => setPainel('manutencao')}>Registrar manutenção</Button>
          </div>
        </div>
        <Horimetro grande horasDesde={m.horas_desde_ultima_manutencao} intervalo={m.intervalo_manutencao_horas} status={m.status_manutencao} />
      </section>

      <dl className="fatos">
        {fatos.map(([rotulo, valor]) => (
          <div key={rotulo}>
            <dt>{rotulo}</dt>
            <dd className="tabular">{valor}</dd>
          </div>
        ))}
      </dl>

      <section className="secao">
        <div className="abas" role="tablist" aria-label="Histórico">
          <button type="button" role="tab" id="aba-manutencoes" aria-selected={aba === 'manutencoes'} aria-controls="painel-historico" onClick={() => setAba('manutencoes')}>
            Manutenções <span className="muted">{manutencoes.length}</span>
          </button>
          <button type="button" role="tab" id="aba-usos" aria-selected={aba === 'usos'} aria-controls="painel-historico" onClick={() => setAba('usos')}>
            Horas apontadas <span className="muted">{usos.length}</span>
          </button>
        </div>
        <div id="painel-historico" role="tabpanel" aria-labelledby={aba === 'usos' ? 'aba-usos' : 'aba-manutencoes'}>
          {aba === 'manutencoes' && (manutencoes.length === 0 ? (
            <Vazio titulo="Nenhuma manutenção registrada" texto="Registre a próxima preventiva para zerar a contagem de horas.">
              <Button onClick={() => setPainel('manutencao')}>Registrar manutenção</Button>
            </Vazio>
          ) : (
            <ol className="linha-tempo">
              {manutencoes.map((mt) => (
                <li key={mt.id} className={`evento evento-${mt.tipo}`}>
                  <div className="evento-topo">
                    <strong>{TIPOS_MANUTENCAO[mt.tipo]}</strong>
                    <span className="muted tabular">{data(mt.data)}, com {horas(mt.horas_maquina)} no horímetro</span>
                  </div>
                  {mt.descricao && <p>{mt.descricao}</p>}
                  <p className="muted pequeno">
                    {[mt.responsavel, mt.custo != null ? moeda(mt.custo) : null].filter(Boolean).join(', ') || 'Sem responsável ou custo informado'}
                  </p>
                </li>
              ))}
            </ol>
          ))}
          {aba === 'usos' && (usos.length === 0 ? (
            <Vazio titulo="Nenhuma hora apontada" texto="Aponte as horas trabalhadas ao fim de cada turno para manter o horímetro atualizado.">
              <Button onClick={() => setPainel('uso')}>Apontar horas</Button>
            </Vazio>
          ) : (
            <div className="tabela-envoltorio">
              <table className="tabela">
                <thead>
                  <tr><th scope="col">Data</th><th scope="col" className="num">Horas</th><th scope="col">Observação</th></tr>
                </thead>
                <tbody>
                  {usos.map((u) => (
                    <tr key={u.id}>
                      <td className="tabular">{data(u.data)}</td>
                      <td className="num tabular">{horas(u.horas)}</td>
                      <td className="muted">{u.observacao || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      <Drawer aberto={painel === 'editar'} titulo={`Editar ${m.nome}`} onFechar={fechar}>
        <MaquinaForm maquina={m} onSalvo={aposSalvar} onCancelar={fechar} />
      </Drawer>
      <Drawer aberto={painel === 'uso'} titulo="Apontar horas" descricao={`${m.nome} (${m.codigo})`} onFechar={fechar}>
        <UsoForm maquinaFixa={m} onSalvo={aposSalvar} onCancelar={fechar} />
      </Drawer>
      <Drawer aberto={painel === 'manutencao'} titulo="Registrar manutenção" descricao={`${m.nome} (${m.codigo})`} onFechar={fechar}>
        <ManutencaoForm maquinaFixa={m} onSalvo={aposSalvar} onCancelar={fechar} />
      </Drawer>
      <Confirmacao
        aberto={painel === 'excluir'}
        titulo="Excluir máquina"
        texto={`${m.nome} (${m.codigo}) será excluída junto com ${usos.length} apontamentos de horas e ${manutencoes.length} manutenções. Essa ação não pode ser desfeita.`}
        acao="Excluir máquina"
        ocupado={excluindo}
        onConfirmar={excluir}
        onCancelar={fechar}
      />
    </div>
  )
}
