class MaquinasController < ApplicationController
  before_action :carregar_maquina, only: %i[show update destroy]

  def index
    maquinas = Maquina.includes(:manutencoes).order(:nome)
    render json: maquinas.map { |maquina| MaquinaSerializer.call(maquina) }, escape: true
  end

  def show
    render json: MaquinaSerializer.call(@maquina), escape: true
  end

  def create
    maquina = Maquina.new(maquina_params)
    if maquina.save
      render json: MaquinaSerializer.call(maquina), status: :created, escape: true
    else
      render_erros_validacao(maquina)
    end
  end

  def update
    if @maquina.update(maquina_params)
      render json: MaquinaSerializer.call(@maquina.reload), escape: true
    else
      render_erros_validacao(@maquina)
    end
  end

  def destroy
    @maquina.destroy!
    head :no_content
  end

  private

  def carregar_maquina
    @maquina = buscar_maquina(params[:id])
  end

  def maquina_params
    params.require(:maquina).permit(
      :nome, :codigo, :fabricante, :modelo, :localizacao,
      :data_aquisicao, :intervalo_manutencao_horas, :horas_uso_total
    )
  end
end
