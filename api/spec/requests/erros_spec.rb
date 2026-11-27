require "rails_helper"

RSpec.describe "Tratamento de erros", type: :request do
  it "mascara erros inesperados sem expor stack trace" do
    allow(Maquina).to receive(:includes).and_raise(StandardError, "falha no banco /app/models/maquina.rb:10")
    get "/maquinas"
    expect(response).to have_http_status(:internal_server_error)
    expect(json).to eq("error" => "Erro interno do servidor")
    expect(response.body).not_to include("maquina.rb")
  end
end
