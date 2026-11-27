import { useMemo, useState } from 'react'
import { api } from '../api.js'
import { MaquinaForm, UsoForm } from '../components/forms.jsx'
import Horimetro from '../components/Horimetro.jsx'
import { Button, Carregando, Drawer, ErroCarregamento, StatusBadge, Vazio } from '../components/ui.jsx'
import { mensagemStatus, STATUS } from '../format.js'
import { navegar, useCarregar } from '../hooks.js'

const normalizar = (texto) => (texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function Maquinas({ aoMudar }) {
  const { dados: maquinas, erro, carregando, recarregar } = useCarregar(() => api.listarMaquinas())
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [painel, setPainel] = useState(null)

  const visiveis = useMemo(() => {
    const termo = normalizar(busca)
    return (maquinas || []).filter((m) =>
      (filtro === 'todas' || m.status_manutencao === filtro) &&
      (!termo || [m.nome, m.codigo, m.localizacao, m.fabricante].some((c) => normalizar(c).includes(termo))))
  }, [maquinas, busca, filtro])

  const fechar = () => setPainel(null)
  const aposSalvar = () => {
    fechar()
    recarregar()
    aoMudar()
  }

  return (
    <div className="pagina">
      <header className="pagina-topo">
        <div>
          <h1>Máquinas</h1>
          <p className="muted">Cadastro da frota e situação de cada horímetro em relação à preventiva.</p>
        </div>
        <Button onClick={() => setPainel({ tipo: 'nova' })}>Cadastrar máquina</Button>
      </header>

      <div className="filtros">
        <label className="busca">
          <span className="sr-only">Buscar máquina</span>
          <input type="search" placeholder="Buscar por nome, código ou local" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Filtrar por situação">
          {['todas', 'em_dia', 'proxima', 'atrasada'].map((valor) => (
            <button key={valor} type="button" className={`chip${filtro === valor ? ' ativo' : ''}`} aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>
              {valor === 'todas' ? 'Todas' : STATUS[valor].rotulo}
            </button>
          ))}
        </div>
      </div>

      {carregando && !maquinas && <Carregando />}
      {erro && <ErroCarregamento erro={erro} onTentar={recarregar} />}
      {maquinas && maquinas.length === 0 && (
        <Vazio titulo="Nenhuma máquina cadastrada" texto="Cadastre a primeira máquina com o intervalo de preventiva para começar a acompanhar as horas.">
          <Button onClick={() => setPainel({ tipo: 'nova' })}>Cadastrar máquina</Button>
        </Vazio>
      )}
      {maquinas && maquinas.length > 0 && visiveis.length === 0 && (
        <Vazio titulo="Nenhuma máquina encontrada" texto="Ajuste a busca ou o filtro de situação." />
      )}

      {visiveis.length > 0 && (
        <div className="tabela-envoltorio">
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Máquina</th>
                <th scope="col" className="col-horimetro">Horas desde a preventiva</th>
                <th scope="col">Situação</th>
                <th scope="col"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((m) => (
                <tr key={m.id} onClick={(e) => !e.target.closest('button, a') && navegar(`/maquinas/${m.id}`)} className="linha-clicavel">
                  <td>
                    <a href={`#/maquinas/${m.id}`} className="celula-maquina">
                      <strong>{m.nome}</strong>
                      <span className="codigo-maquina">{m.codigo}{m.localizacao && <span> em {m.localizacao}</span>}</span>
                    </a>
                  </td>
                  <td className="col-horimetro">
                    <Horimetro horasDesde={m.horas_desde_ultima_manutencao} intervalo={m.intervalo_manutencao_horas} status={m.status_manutencao} />
                  </td>
                  <td>
                    <div className="celula-status">
                      <StatusBadge status={m.status_manutencao} />
                      <span className="pequeno muted">{mensagemStatus(m)}</span>
                    </div>
                  </td>
                  <td className="celula-acoes">
                    <Button variant="ghost" className="btn-pequeno" onClick={() => setPainel({ tipo: 'uso', maquina: m })}>Apontar horas</Button>
                    <Button variant="ghost" className="btn-pequeno" onClick={() => setPainel({ tipo: 'editar', maquina: m })}>Editar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer aberto={painel?.tipo === 'nova'} titulo="Cadastrar máquina" descricao="O intervalo define a cada quantas horas a preventiva é devida." onFechar={fechar}>
        <MaquinaForm onSalvo={aposSalvar} onCancelar={fechar} />
      </Drawer>
      <Drawer aberto={painel?.tipo === 'editar'} titulo={`Editar ${painel?.maquina?.nome ?? ''}`} onFechar={fechar}>
        {painel?.maquina && <MaquinaForm maquina={painel.maquina} onSalvo={aposSalvar} onCancelar={fechar} />}
      </Drawer>
      <Drawer aberto={painel?.tipo === 'uso'} titulo="Apontar horas" descricao={painel?.maquina?.nome} onFechar={fechar}>
        {painel?.maquina && <UsoForm maquinaFixa={painel.maquina} onSalvo={aposSalvar} onCancelar={fechar} />}
      </Drawer>
    </div>
  )
}
