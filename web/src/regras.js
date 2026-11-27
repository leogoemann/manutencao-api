export const LIMITE_PROXIMA = 0.1

export function calcularStatus(intervalo, horasDesde) {
  const restantes = intervalo - horasDesde
  if (restantes <= 0) return { status: 'atrasada', restantes }
  if (restantes <= intervalo * LIMITE_PROXIMA) return { status: 'proxima', restantes }
  return { status: 'em_dia', restantes }
}

export function simularUso(maquina, horas) {
  const desde = Number(maquina.horas_desde_ultima_manutencao) + (Number(horas) || 0)
  return { horasDesde: desde, ...calcularStatus(Number(maquina.intervalo_manutencao_horas), desde) }
}

export function simularManutencao(maquina, tipo) {
  if (tipo !== 'preventiva') {
    return {
      horasDesde: Number(maquina.horas_desde_ultima_manutencao),
      status: maquina.status_manutencao,
      restantes: Number(maquina.horas_restantes),
    }
  }
  return { horasDesde: 0, ...calcularStatus(Number(maquina.intervalo_manutencao_horas), 0) }
}
