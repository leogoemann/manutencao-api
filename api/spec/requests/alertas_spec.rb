require "rails_helper"

RSpec.describe "Alertas", type: :request do
  let!(:em_dia) { create(:maquina, nome: "Em dia", intervalo_manutencao_horas: 100, horas_uso_total: 10) }
  let!(:proxima) { create(:maquina, nome: "Próxima", intervalo_manutencao_horas: 200, horas_uso_total: 180) }
  let!(:atrasada) { create(:maquina, nome: "Atrasada", intervalo_manutencao_horas: 250, horas_uso_total: 285) }

  it "retorna por padrão apenas próximas e atrasadas, atrasadas primeiro" do
    get "/alertas"
    expect(response).to have_http_status(:ok)
    expect(json.map { |a| a["maquina_nome"] }).to eq([ "Atrasada", "Próxima" ])
    expect(json.first).to include(
      "maquina_id" => atrasada.id,
      "status" => "atrasada",
      "mensagem" => "Manutenção atrasada em 35 h",
      "horas_restantes" => -35.0,
      "horas_desde_ultima_manutencao" => 285.0
    )
    expect(json.last["mensagem"]).to eq("Faltam 20 h para a manutenção")
  end

  it "filtra por status" do
    get "/alertas", params: { status: "em_dia" }
    expect(json.map { |a| a["maquina_id"] }).to eq([ em_dia.id ])
    get "/alertas", params: { status: "atrasada" }
    expect(json.map { |a| a["maquina_id"] }).to eq([ atrasada.id ])
    get "/alertas", params: { status: "proxima" }
    expect(json.map { |a| a["maquina_id"] }).to eq([ proxima.id ])
  end

  it "retorna 422 para status inválido" do
    get "/alertas", params: { status: "quebrada" }
    expect(response).to have_http_status(:unprocessable_content)
    expect(json["errors"]).to have_key("status")
  end
end
