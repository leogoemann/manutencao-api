class ApplicationController < ActionController::API
  rescue_from StandardError, with: :erro_interno
  rescue_from ActiveRecord::RecordNotFound, with: :nao_encontrado
  rescue_from ActiveRecord::RecordInvalid, with: :registro_invalido
  rescue_from ActionController::ParameterMissing, with: :parametro_ausente
  rescue_from ActionDispatch::Http::Parameters::ParseError, with: :json_invalido
  def rota_nao_encontrada
    render json: { error: "Rota não encontrada" }, status: :not_found, escape: true
  end

  private

  def nao_encontrado(erro)
    mensagem = erro.model == "Maquina" ? "Máquina não encontrada" : "Registro não encontrado"
    render json: { error: mensagem }, status: :not_found, escape: true
  end

  def registro_invalido(erro)
    render_erros_validacao(erro.record)
  end

  def render_erros_validacao(registro)
    render json: { errors: registro.errors.to_hash }, status: :unprocessable_content, escape: true
  end

  def parametro_ausente(erro)
    render json: { errors: { erro.param => [ I18n.t("errors.messages.required") ] } }, status: :unprocessable_content, escape: true
  end

  def json_invalido(_erro)
    render json: { error: "JSON inválido no corpo da requisição" }, status: :bad_request, escape: true
  end

  def erro_interno(erro)
    Rails.logger.error({ evento: "erro_interno", classe: erro.class.name, mensagem: erro.message, request_id: request.request_id }.to_json)
    Rails.logger.error(erro.backtrace.first(10).join("\n")) if erro.backtrace
    render json: { error: "Erro interno do servidor" }, status: :internal_server_error, escape: true
  end

  def buscar_maquina(id)
    Maquina.find(id)
  end
end
