class ManutencoesController < ApplicationController
  before_action :carregar_maquina

  def index
    manutencoes = @maquina.manutencoes.recentes_primeiro
    manutencoes = manutencoes.where(tipo: params[:tipo]) if params[:tipo].present?
    render json: manutencoes.map { |manutencao| ManutencaoSerializer.call(manutencao) }, escape: true
  end

  def create
    manutencao = @maquina.manutencoes.build(manutencao_params)
    if manutencao.save
      render json: ManutencaoSerializer.call(manutencao), status: :created, escape: true
    else
      render_erros_validacao(manutencao)
    end
  end

  private

  def carregar_maquina
    @maquina = buscar_maquina(params[:maquina_id])
  end

  def manutencao_params
    params.require(:manutencao).permit(:data, :tipo, :descricao, :responsavel, :horas_maquina, :custo)
  end
end
