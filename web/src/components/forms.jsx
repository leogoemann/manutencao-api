import { useState } from 'react'
import { api } from '../api.js'
import { hojeIso, horas, numero, STATUS, TIPOS_MANUTENCAO } from '../format.js'
import { simularManutencao, simularUso } from '../regras.js'
import Horimetro from './Horimetro.jsx'
import { Button, Field, StatusBadge } from './ui.jsx'
import { useToast } from './toast.js'

function useFormulario(inicial) {
  const [valores, setValores] = useState(inicial)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const alterar = (campo) => (evento) => setValores((v) => ({ ...v, [campo]: evento.target.value }))
  const erro = (campo) => erros[campo]?.join(', ')

  async function enviar(acao) {
    setEnviando(true)
    setErros({})
    setErroGeral(null)
    try {
      return await acao()
    } catch (e) {
      if (e.fieldErrors) setErros(e.fieldErrors)
      setErroGeral(e.fieldErrors ? 'Revise os campos destacados.' : e.message)
      return null
    } finally {
      setEnviando(false)
    }
  }

  return { valores, setValores, alterar, erro, erroGeral, enviando, enviar }
}

const limpar = (objeto) =>
  Object.fromEntries(Object.entries(objeto).map(([k, v]) => [k, typeof v === 'string' && v.trim() === '' ? null : v]))

function SeletorMaquina({ maquinas, valor, onChange, erro }) {
  return (
    <Field label="Máquina" error={erro}>
      {(props) => (
        <select {...props} value={valor} onChange={onChange} required>
          <option value="">Selecione a máquina</option>
          {maquinas.map((m) => (
            <option key={m.id} value={m.id}>{m.nome} ({m.codigo})</option>
          ))}
        </select>
      )}
    </Field>
  )
}

function Previsao({ maquina, resultado, titulo }) {
  if (!maquina) return null
  const mudou = resultado.status !== maquina.status_manutencao
  const atual = Number(maquina.horas_desde_ultima_manutencao)
  return (
    <div className="previsao" aria-live="polite">
      <p className="previsao-titulo">{titulo}</p>
      <Horimetro
        horasDesde={Math.min(atual, resultado.horasDesde)}
        intervalo={maquina.intervalo_manutencao_horas}
        status={resultado.horasDesde < atual ? resultado.status : maquina.status_manutencao}
        previsto={resultado}
      />
      <p className="previsao-linha">
        <StatusBadge status={maquina.status_manutencao} />
        {mudou && (
          <>
            <span className="muted" aria-hidden="true">para</span>
            <span className="sr-only">passa para</span>
            <StatusBadge status={resultado.status} />
          </>
        )}
        <span className="muted">
          {resultado.restantes <= 0
            ? `atrasada em ${numero(Math.abs(resultado.restantes))} h`
            : `restarão ${numero(resultado.restantes)} h`}
        </span>
      </p>
      {mudou && resultado.status !== 'em_dia' && (
        <p className={`previsao-aviso st-texto-${STATUS[resultado.status].classe}`}>
          Este registro vai gerar um alerta de manutenção {resultado.status === 'atrasada' ? 'atrasada' : 'próxima'}.
        </p>
      )}
    </div>
  )
}

export function MaquinaForm({ maquina, onSalvo, onCancelar }) {
  const avisar = useToast()
  const f = useFormulario({
    nome: maquina?.nome ?? '',
    codigo: maquina?.codigo ?? '',
    fabricante: maquina?.fabricante ?? '',
    modelo: maquina?.modelo ?? '',
    localizacao: maquina?.localizacao ?? '',
    data_aquisicao: maquina?.data_aquisicao ?? '',
    intervalo_manutencao_horas: maquina?.intervalo_manutencao_horas ?? '',
    horas_uso_total: maquina?.horas_uso_total ?? '',
  })

  async function salvar(evento) {
    evento.preventDefault()
    const dados = limpar(f.valores)
    if (dados.horas_uso_total == null) delete dados.horas_uso_total
    const salvo = await f.enviar(() => (maquina ? api.atualizarMaquina(maquina.id, dados) : api.criarMaquina(dados)))
    if (salvo) {
      avisar(maquina ? 'Máquina atualizada.' : 'Máquina cadastrada.')
      onSalvo?.(salvo)
    }
  }

  return (
    <form className="form" onSubmit={salvar} noValidate>
      <div className="form-grade">
        <Field label="Nome" error={f.erro('nome')}>
          {(p) => <input {...p} value={f.valores.nome} onChange={f.alterar('nome')} placeholder="Torno CNC" required autoComplete="off" />}
        </Field>
        <Field label="Código" error={f.erro('codigo')} hint="Identificador único na planta">
          {(p) => <input {...p} value={f.valores.codigo} onChange={f.alterar('codigo')} placeholder="TRN-001" required autoComplete="off" />}
        </Field>
        <Field label="Fabricante" error={f.erro('fabricante')}>
          {(p) => <input {...p} value={f.valores.fabricante} onChange={f.alterar('fabricante')} />}
        </Field>
        <Field label="Modelo" error={f.erro('modelo')}>
          {(p) => <input {...p} value={f.valores.modelo} onChange={f.alterar('modelo')} />}
        </Field>
        <Field label="Localização" error={f.erro('localizacao')}>
          {(p) => <input {...p} value={f.valores.localizacao} onChange={f.alterar('localizacao')} placeholder="Usinagem, linha 1" />}
        </Field>
        <Field label="Data de aquisição" error={f.erro('data_aquisicao')}>
          {(p) => <input {...p} type="date" value={f.valores.data_aquisicao} onChange={f.alterar('data_aquisicao')} />}
        </Field>
        <Field label="Intervalo da preventiva (h)" error={f.erro('intervalo_manutencao_horas')} hint="A cada quantas horas de uso">
          {(p) => <input {...p} type="number" min="0" step="0.1" inputMode="decimal" value={f.valores.intervalo_manutencao_horas} onChange={f.alterar('intervalo_manutencao_horas')} required />}
        </Field>
        <Field label="Horas de uso acumuladas" error={f.erro('horas_uso_total')} hint={maquina ? 'Prefira apontar horas para manter o histórico' : 'Deixe em branco para começar em 0 h'}>
          {(p) => <input {...p} type="number" min="0" step="0.1" inputMode="decimal" value={f.valores.horas_uso_total} onChange={f.alterar('horas_uso_total')} />}
        </Field>
      </div>
      {f.erroGeral && <p className="form-erro" role="alert">{f.erroGeral}</p>}
      <div className="form-acoes">
        {onCancelar && <Button variant="ghost" onClick={onCancelar}>Cancelar</Button>}
        <Button type="submit" disabled={f.enviando}>{f.enviando ? 'Salvando…' : maquina ? 'Salvar alterações' : 'Cadastrar máquina'}</Button>
      </div>
    </form>
  )
}

export function UsoForm({ maquinas, maquinaFixa, onSalvo, onCancelar }) {
  const avisar = useToast()
  const f = useFormulario({ maquina_id: maquinaFixa?.id ?? '', horas: '', data: hojeIso(), observacao: '' })
  const maquina = maquinaFixa || maquinas?.find((m) => String(m.id) === String(f.valores.maquina_id))
  const resultado = maquina ? simularUso(maquina, f.valores.horas) : null

  async function salvar(evento) {
    evento.preventDefault()
    if (!maquina) return f.enviar(async () => { throw Object.assign(new Error(''), { fieldErrors: { maquina_id: ['selecione uma máquina'] } }) })
    const { horas: h, data, observacao } = f.valores
    const salvo = await f.enviar(() => api.registrarUso(maquina.id, limpar({ horas: h, data, observacao })))
    if (salvo) {
      avisar(`${horas(salvo.horas)} apontadas em ${maquina.codigo}.`)
      f.setValores((v) => ({ ...v, horas: '', observacao: '' }))
      onSalvo?.(salvo)
    }
  }

  return (
    <form className="form" onSubmit={salvar} noValidate>
      {!maquinaFixa && (
        <SeletorMaquina maquinas={maquinas} valor={f.valores.maquina_id} onChange={f.alterar('maquina_id')} erro={f.erro('maquina_id')} />
      )}
      <div className="form-grade">
        <Field label="Horas trabalhadas" error={f.erro('horas')}>
          {(p) => <input {...p} type="number" min="0" step="0.1" inputMode="decimal" value={f.valores.horas} onChange={f.alterar('horas')} placeholder="8" required />}
        </Field>
        <Field label="Data" error={f.erro('data')}>
          {(p) => <input {...p} type="date" max={hojeIso()} value={f.valores.data} onChange={f.alterar('data')} required />}
        </Field>
      </div>
      <Field label="Observação" error={f.erro('observacao')}>
        {(p) => <textarea {...p} rows="2" value={f.valores.observacao} onChange={f.alterar('observacao')} placeholder="Turno, operador, ordem de produção…" />}
      </Field>
      {maquina && <Previsao maquina={maquina} resultado={resultado} titulo="Depois deste apontamento" />}
      {f.erroGeral && <p className="form-erro" role="alert">{f.erroGeral}</p>}
      <div className="form-acoes">
        {onCancelar && <Button variant="ghost" onClick={onCancelar}>Cancelar</Button>}
        <Button type="submit" disabled={f.enviando}>{f.enviando ? 'Apontando…' : 'Apontar horas'}</Button>
      </div>
    </form>
  )
}

export function ManutencaoForm({ maquinas, maquinaFixa, tipoInicial = 'preventiva', onSalvo, onCancelar }) {
  const avisar = useToast()
  const f = useFormulario({
    maquina_id: maquinaFixa?.id ?? '',
    tipo: tipoInicial,
    data: hojeIso(),
    horas_maquina: '',
    responsavel: '',
    custo: '',
    descricao: '',
  })
  const maquina = maquinaFixa || maquinas?.find((m) => String(m.id) === String(f.valores.maquina_id))
  const resultado = maquina ? simularManutencao(maquina, f.valores.tipo) : null

  async function salvar(evento) {
    evento.preventDefault()
    if (!maquina) return f.enviar(async () => { throw Object.assign(new Error(''), { fieldErrors: { maquina_id: ['selecione uma máquina'] } }) })
    const { maquina_id: _ignorado, ...dados } = f.valores
    const salvo = await f.enviar(() => api.registrarManutencao(maquina.id, limpar(dados)))
    if (salvo) {
      avisar(`Manutenção ${TIPOS_MANUTENCAO[salvo.tipo].toLowerCase()} registrada em ${maquina.codigo}.`)
      onSalvo?.(salvo)
    }
  }

  return (
    <form className="form" onSubmit={salvar} noValidate>
      {!maquinaFixa && (
        <SeletorMaquina maquinas={maquinas} valor={f.valores.maquina_id} onChange={f.alterar('maquina_id')} erro={f.erro('maquina_id')} />
      )}
      <fieldset className="segmentado">
        <legend>Tipo</legend>
        {Object.entries(TIPOS_MANUTENCAO).map(([valor, rotulo]) => (
          <label key={valor} className={f.valores.tipo === valor ? 'ativo' : ''}>
            <input type="radio" name="tipo" value={valor} checked={f.valores.tipo === valor} onChange={f.alterar('tipo')} />
            {rotulo}
          </label>
        ))}
      </fieldset>
      {f.erro('tipo') && <p className="field-hint field-error">{f.erro('tipo')}</p>}
      <p className="muted pequeno">
        {f.valores.tipo === 'preventiva'
          ? 'A preventiva zera a contagem de horas até a próxima manutenção.'
          : 'Corretivas e preditivas ficam no histórico, mas não zeram a contagem da preventiva.'}
      </p>
      <div className="form-grade">
        <Field label="Data" error={f.erro('data')}>
          {(p) => <input {...p} type="date" max={hojeIso()} value={f.valores.data} onChange={f.alterar('data')} required />}
        </Field>
        <Field label="Horímetro na manutenção (h)" error={f.erro('horas_maquina')} hint={maquina ? `Em branco usa o atual: ${horas(maquina.horas_uso_total)}` : 'Em branco usa as horas atuais'}>
          {(p) => <input {...p} type="number" min="0" step="0.1" inputMode="decimal" value={f.valores.horas_maquina} onChange={f.alterar('horas_maquina')} />}
        </Field>
        <Field label="Responsável" error={f.erro('responsavel')}>
          {(p) => <input {...p} value={f.valores.responsavel} onChange={f.alterar('responsavel')} autoComplete="name" />}
        </Field>
        <Field label="Custo (R$)" error={f.erro('custo')}>
          {(p) => <input {...p} type="number" min="0" step="0.01" inputMode="decimal" value={f.valores.custo} onChange={f.alterar('custo')} />}
        </Field>
      </div>
      <Field label="Descrição do serviço" error={f.erro('descricao')}>
        {(p) => <textarea {...p} rows="3" value={f.valores.descricao} onChange={f.alterar('descricao')} placeholder="Troca de óleo, filtros, inspeção de rolamentos…" />}
      </Field>
      {maquina && f.valores.tipo === 'preventiva' && !f.valores.horas_maquina && (
        <Previsao maquina={maquina} resultado={resultado} titulo="Depois desta preventiva" />
      )}
      {f.erroGeral && <p className="form-erro" role="alert">{f.erroGeral}</p>}
      <div className="form-acoes">
        {onCancelar && <Button variant="ghost" onClick={onCancelar}>Cancelar</Button>}
        <Button type="submit" disabled={f.enviando}>{f.enviando ? 'Registrando…' : 'Registrar manutenção'}</Button>
      </div>
    </form>
  )
}
