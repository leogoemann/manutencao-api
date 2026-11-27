require "rails_helper"

RSpec.describe "Manutenções", type: :request do
  let(:headers) { { "CONTENT_TYPE" => "application/json" } }
  let(:maquina) { create(:maquina, intervalo_manutencao_horas: 100, horas_uso_total: 120) }

  def registrar(atributos)
    post "/maquinas/#{maquina.id}/manutencoes", params: { manutencao: atributos }.to_json, headers: headers
  end

  it "lista manutenções da máquina com filtro por tipo" do
    create(:manutencao, maquina: maquina, tipo: "corretiva")
    create(:manutencao, maquina: maquina, tipo: "preventiva")
    get "/maquinas/#{maquina.id}/manutencoes", params: { tipo: "corretiva" }
    expect(response).to have_http_status(:ok)
    expect(json.map { |m| m["tipo"] }).to eq([ "corretiva" ])
  end

  it "preventiva reinicia a contagem usando as horas atuais da máquina" do
    registrar(data: Time.zone.today.iso8601, tipo: "preventiva", custo: 300)
    expect(response).to have_http_status(:created)
    expect(json["horas_maquina"]).to eq(120.0)
    get "/maquinas/#{maquina.id}"
    expect(json).to include("horas_desde_ultima_manutencao" => 0.0, "horas_restantes" => 100.0, "status_manutencao" => "em_dia", "ultima_manutencao_em" => Time.zone.today.iso8601)
  end

  it "corretiva não reinicia a contagem" do
    registrar(data: Time.zone.today.iso8601, tipo: "corretiva")
    expect(response).to have_http_status(:created)
    get "/maquinas/#{maquina.id}"
    expect(json).to include("horas_desde_ultima_manutencao" => 120.0, "status_manutencao" => "atrasada")
  end

  it "retorna 422 para tipo inválido, data futura e custo negativo" do
    registrar(data: Time.zone.tomorrow.iso8601, tipo: "outra", custo: -10)
    expect(response).to have_http_status(:unprocessable_content)
    expect(json["errors"].keys).to contain_exactly("data", "tipo", "custo")
  end

  it "retorna 404 quando a máquina não existe" do
    get "/maquinas/0/manutencoes"
    expect(response).to have_http_status(:not_found)
  end
end
