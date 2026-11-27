class AlertasController < ApplicationController
  STATUS_PADRAO = %w[proxima atrasada].freeze
  ORDEM_STATUS = { "atrasada" => 0, "proxima" => 1, "em_dia" => 2 }.freeze

  def index
    filtro = filtro_status
    return if performed?

    maquinas = Maquina.includes(:manutencoes).select { |maquina| filtro.include?(maquina.status_manutencao.status) }
    maquinas.sort_by! { |maquina| [ ORDEM_STATUS[maquina.status_manutencao.status], maquina.status_manutencao.horas_restantes ] }
    render json: maquinas.map { |maquina| AlertaSerializer.call(maquina) }, escape: true
  end

  private

  def filtro_status
    return STATUS_PADRAO if params[:status].blank?

    valores = params[:status].to_s.split(",").map(&:strip)
    return valores if (valores - StatusManutencao::STATUS).empty?

    render json: { errors: { status: [ I18n.t("errors.messages.inclusion") ] } }, status: :unprocessable_content, escape: true
    nil
  end
end
