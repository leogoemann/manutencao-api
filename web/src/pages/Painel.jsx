import { api } from '../api.js'
import Horimetro from '../components/Horimetro.jsx'
import { Carregando, ErroCarregamento, StatusBadge, Vazio } from '../components/ui.jsx'
import { mensagemStatus, numero } from '../format.js'
import { useCarregar } from '../hooks.js'

const ORDEM = { atrasada: 0, proxima: 1, em_dia: 2 }

function plural(n, um, varios) {
  return `${n} ${n === 1 ? um : varios}`
}

function manchete(contagem) {
  const atencao = contagem.atrasada + contagem.proxima
  if (atencao === 0) return 'Toda a frota está com a preventiva em dia'
  return `${plural(atencao, 'máquina precisa', 'máquinas precisam')} de manutenção`
}

export default function Painel() {
  const { dados: maquinas, erro, carregando, recarregar } = useCarregar(() => api.listarMaquinas())

  if (carregando && !maquinas) return <Carregando texto="Lendo os horímetros…" />
  if (erro) return <ErroCarregamento erro={erro} onTentar={recarregar} />

  if (maquinas.length === 0) {
    return (
      <div className="pagina">
        <Vazio titulo="Nenhuma máquina acompanhada ainda" texto="Cadastre a primeira máquina com o intervalo da preventiva. A partir daí, cada hora apontada mostra quanto falta para a próxima manutenção.">
          <a className="btn btn-primary" href="#/maquinas">Cadastrar máquina</a>
        </Vazio>
      </div>
    )
  }

  const contagem = { em_dia: 0, proxima: 0, atrasada: 0 }
  maquinas.forEach((m) => { contagem[m.status_manutencao] += 1 })
  const horasTotais = maquinas.reduce((soma, m) => soma + Number(m.horas_uso_total), 0)
  const frota = [...maquinas].sort((a, b) =>
    ORDEM[a.status_manutencao] - ORDEM[b.status_manutencao] || a.horas_restantes - b.horas_restantes)

  const detalhes = []
  if (contagem.atrasada) detalhes.push(plural(contagem.atrasada, 'atrasada', 'atrasadas'))
  if (contagem.proxima) detalhes.push(plural(contagem.proxima, 'perto do limite', 'perto do limite'))

  return (
    <div className="pagina">
      <header className="abertura">
        <h1 className={contagem.atrasada ? 'abertura-tem-atraso' : ''}>{manchete(contagem)}</h1>
        <p className="abertura-resumo">
          {detalhes.length > 0 && <>{detalhes.join(' e ')}. </>}
          São {plural(maquinas.length, 'máquina acompanhada', 'máquinas acompanhadas')}, com {numero(horasTotais)} horas de uso registradas no total.
        </p>
        <div className="acoes-topo">
          <a className="btn btn-primary" href="#/horas">Apontar horas</a>
          {contagem.atrasada + contagem.proxima > 0 && <a className="btn btn-ghost" href="#/alertas">Ver alertas</a>}
        </div>
      </header>

      <section className="secao" aria-labelledby="frota-titulo">
        <div className="secao-topo">
          <h2 id="frota-titulo">Horímetros da frota</h2>
          <p className="muted pequeno">Horas desde a última preventiva. A faixa marcada é o trecho final de 10% do intervalo.</p>
        </div>
        <ul className="frota">
          {frota.map((m) => (
            <li key={m.id}>
              <a href={`#/maquinas/${m.id}`} className="frota-linha">
                <div className="frota-maquina">
                  <span className="frota-nome">{m.nome}</span>
                  <span className="codigo-maquina">{m.codigo}{m.localizacao && <span className="muted"> em {m.localizacao}</span>}</span>
                </div>
                <Horimetro horasDesde={m.horas_desde_ultima_manutencao} intervalo={m.intervalo_manutencao_horas} status={m.status_manutencao} />
                <div className="frota-situacao">
                  <StatusBadge status={m.status_manutencao} />
                  <span className="pequeno muted">{mensagemStatus(m)}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="como-funciona" aria-labelledby="como-titulo">
        <h2 id="como-titulo">Como a situação é calculada</h2>
        <ol>
          <li><strong>Cadastro.</strong> Cada máquina recebe o intervalo da preventiva em horas.</li>
          <li><strong>Apontamento.</strong> As horas trabalhadas somam ao horímetro da máquina.</li>
          <li><strong>Regra de limite.</strong> Faltando 10% do intervalo ou menos, a preventiva fica próxima. Sem horas restantes, fica atrasada.</li>
          <li><strong>Alerta.</strong> Máquinas próximas ou atrasadas aparecem em Alertas até a preventiva ser registrada.</li>
        </ol>
      </section>
    </div>
  )
}
