const horasFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const moedaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const horas = (valor) => `${horasFmt.format(Number(valor) || 0)} h`
export const numero = (valor) => horasFmt.format(Number(valor) || 0)
export const moeda = (valor) => (valor == null ? '—' : moedaFmt.format(valor))

export function data(iso) {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function hojeIso() {
  const agora = new Date()
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export const STATUS = {
  em_dia: { rotulo: 'Em dia', classe: 'ok' },
  proxima: { rotulo: 'Próxima', classe: 'warn' },
  atrasada: { rotulo: 'Atrasada', classe: 'late' },
}

export const TIPOS_MANUTENCAO = {
  preventiva: 'Preventiva',
  corretiva: 'Corretiva',
  preditiva: 'Preditiva',
}

export function mensagemStatus(maquina) {
  const restantes = Number(maquina.horas_restantes)
  if (restantes <= 0) return `Manutenção atrasada em ${numero(Math.abs(restantes))} h`
  return `Faltam ${numero(restantes)} h para a manutenção`
}
