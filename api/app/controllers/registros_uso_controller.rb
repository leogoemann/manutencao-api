class RegistrosUsoController < ApplicationController
  before_action :carregar_maquina

  def index
    registros = @maquina.registros_uso.order(data: :desc, id: :desc)
    render json: registros.map { |registro| RegistroUsoSerializer.call(registro) }, escape: true
  end

  def create
    registro = RegistroUso.registrar!(@maquina, registro_uso_params)
    render json: RegistroUsoSerializer.call(registro), status: :created, escape: true
  end

  private

  def carregar_maquina
    @maquina = buscar_maquina(params[:maquina_id])
  end

  def registro_uso_params
    params.require(:registro_uso).permit(:horas, :data, :observacao)
  end
end
