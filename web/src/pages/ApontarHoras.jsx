import { useRef, useState } from 'react'
import { api } from '../api.js'
import { UsoForm } from '../components/forms.jsx'
import { Button, Carregando, ErroCarregamento, Vazio } from '../components/ui.jsx'
import { lerApontamentos } from '../csv.js'
import { data, horas } from '../format.js'
import { useCarregar } from '../hooks.js'

const TAMANHO_MAXIMO = 512 * 1024

function ImportarCsv({ maquinas, aoConcluir }) {
  const entradaRef = useRef(null)
  const [itens, setItens] = useState([])
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const porCodigo = Object.fromEntries(maquinas.map((m) => [m.codigo.toLowerCase(), m]))

  async function aoEscolher(evento) {
    const arquivo = evento.target.files?.[0]
    setErro(null)
    setItens([])
    if (!arquivo) return
    if (arquivo.size > TAMANHO_MAXIMO) {
      setErro('O arquivo passa de 512 KB. Divida os apontamentos em arquivos menores.')
      return
    }
    setNomeArquivo(arquivo.name)
    const lidos = lerApontamentos(await arquivo.text())
    if (lidos.length === 0) {
      setErro('O arquivo está vazio. Use as colunas codigo;horas;data;observacao.')
      return
    }
    setItens(lidos.map((item) => ({ ...item, situacao: porCodigo[item.codigo?.toLowerCase()] ? 'pendente' : 'sem_maquina' })))
  }

  async function enviar() {
    setEnviando(true)
    const resultado = [...itens]
    for (let i = 0; i < resultado.length; i += 1) {
      const item = resultado[i]
      if (item.situacao !== 'pendente') continue
      const maquina = porCodigo[item.codigo.toLowerCase()]
      try {
        await api.registrarUso(maquina.id, { horas: item.horas, data: item.data, observacao: item.observacao })
        resultado[i] = { ...item, situacao: 'ok' }
      } catch (e) {
        const detalhes = e.fieldErrors ? Object.entries(e.fieldErrors).map(([c, m]) => `${c} ${m.join(', ')}`).join('; ') : e.message
        resultado[i] = { ...item, situacao: 'erro', detalhe: detalhes }
      }
      setItens([...resultado])
    }
    setEnviando(false)
    aoConcluir(resultado.filter((r) => r.situacao === 'ok').length)
  }

  function limpar() {
    setItens([])
    setNomeArquivo('')
    if (entradaRef.current) entradaRef.current.value = ''
  }

  const pendentes = itens.filter((i) => i.situacao === 'pendente').length
  const rotulos = { pendente: 'Pronto', sem_maquina: 'Código não cadastrado', ok: 'Apontado', erro: 'Recusado' }

  return (
    <section className="cartao" aria-labelledby="importar-titulo">
      <h2 id="importar-titulo">Importar planilha de horas</h2>
      <p className="muted">
        Envie um CSV exportado do coletor ou da planilha do turno com as colunas <code>codigo;horas;data;observacao</code>.
        Datas em 27/11/2026 ou 2026-11-27.
      </p>
      <label className="upload">
        <input ref={entradaRef} type="file" accept=".csv,text/csv" onChange={aoEscolher} />
        <span className="upload-caixa">
          <strong>{nomeArquivo || 'Escolher arquivo CSV'}</strong>
          <span className="muted pequeno">até 512 KB</span>
        </span>
      </label>
      {erro && <p className="form-erro" role="alert">{erro}</p>}
      {itens.length > 0 && (
        <>
          <div className="tabela-envoltorio">
            <table className="tabela tabela-compacta">
              <thead>
                <tr><th scope="col">Linha</th><th scope="col">Código</th><th scope="col" className="num">Horas</th><th scope="col">Data</th><th scope="col">Situação</th></tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.linha}>
                    <td className="tabular muted">{item.linha}</td>
                    <td>{item.codigo || '—'}</td>
                    <td className="num tabular">{item.horas ? horas(item.horas) : '—'}</td>
                    <td className="tabular">{data(item.data)}</td>
                    <td>
                      <span className={`situacao situacao-${item.situacao}`}>{rotulos[item.situacao]}</span>
                      {item.detalhe && <span className="pequeno muted"> {item.detalhe}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-acoes">
            <Button variant="ghost" onClick={limpar} disabled={enviando}>Limpar</Button>
            <Button onClick={enviar} disabled={enviando || pendentes === 0}>
              {enviando ? 'Apontando…' : `Apontar ${pendentes} ${pendentes === 1 ? 'linha' : 'linhas'}`}
            </Button>
          </div>
        </>
      )}
    </section>
  )
}

export default function ApontarHoras({ aoMudar }) {
  const carga = useCarregar(() => api.listarMaquinas())
  const [chave, setChave] = useState(0)

  const atualizar = () => {
    carga.recarregar()
    aoMudar()
  }

  return (
    <div className="pagina">
      <header className="pagina-topo">
        <div>
          <h1>Apontar horas de uso</h1>
          <p className="muted">Cada apontamento soma ao horímetro da máquina e recalcula a situação da preventiva.</p>
        </div>
      </header>
      {carga.carregando && !carga.dados && <Carregando />}
      {carga.erro && <ErroCarregamento erro={carga.erro} onTentar={carga.recarregar} />}
      {carga.dados && carga.dados.length === 0 && (
        <Vazio titulo="Nenhuma máquina cadastrada" texto="Cadastre uma máquina antes de apontar horas.">
          <a className="btn btn-primary" href="#/maquinas">Ir para máquinas</a>
        </Vazio>
      )}
      {carga.dados && carga.dados.length > 0 && (
        <div className="duas-colunas">
          <section className="cartao" aria-labelledby="manual-titulo">
            <h2 id="manual-titulo">Apontamento manual</h2>
            <UsoForm key={chave} maquinas={carga.dados} onSalvo={() => { setChave((c) => c + 1); atualizar() }} />
          </section>
          <ImportarCsv maquinas={carga.dados} aoConcluir={(n) => n > 0 && atualizar()} />
        </div>
      )}
    </div>
  )
}
