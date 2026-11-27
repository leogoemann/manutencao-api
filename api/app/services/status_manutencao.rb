class StatusManutencao
  LIMITE_PROXIMA = BigDecimal("0.1")
  STATUS = %w[em_dia proxima atrasada].freeze

  attr_reader :maquina

  def initialize(maquina)
    @maquina = maquina
  end

  def ultima_preventiva
    @ultima_preventiva ||=
      if maquina.manutencoes.loaded?
        maquina.manutencoes.select { |m| m.tipo == "preventiva" && m.persisted? }.max_by { |m| [ m.data, m.id ] }
      else
        maquina.manutencoes.preventivas.recentes_primeiro.first
      end
  end

  def horas_desde_ultima_manutencao
    base = ultima_preventiva&.horas_maquina || 0
    [ maquina.horas_uso_total - base, BigDecimal("0") ].max
  end

  def horas_restantes
    maquina.intervalo_manutencao_horas - horas_desde_ultima_manutencao
  end

  def ultima_manutencao_em
    ultima_preventiva&.data
  end

  def status
    return "atrasada" if horas_restantes <= 0
    return "proxima" if horas_restantes <= maquina.intervalo_manutencao_horas * LIMITE_PROXIMA

    "em_dia"
  end

  def mensagem
    case status
    when "atrasada" then "Manutenção atrasada em #{formatar_horas(horas_restantes.abs)} h"
    else "Faltam #{formatar_horas(horas_restantes)} h para a manutenção"
    end
  end

  def to_h
    {
      horas_desde_ultima_manutencao: horas_desde_ultima_manutencao.to_f,
      horas_restantes: horas_restantes.to_f,
      ultima_manutencao_em: ultima_manutencao_em&.iso8601,
      status_manutencao: status
    }
  end

  private

  def formatar_horas(valor)
    arredondado = valor.round(2)
    arredondado == arredondado.to_i ? arredondado.to_i.to_s : arredondado.to_s("F")
  end
end
