require "rails_helper"

RSpec.describe "Registros de uso", type: :request do
  let(:headers) { { "CONTENT_TYPE" => "application/json" } }
  let(:maquina) { create(:maquina, intervalo_manutencao_horas: 100, horas_uso_total: 50) }

  it "lista os registros da máquina" do
    create(:registro_uso, maquina: maquina, horas: 4)
    create(:registro_uso, maquina: create(:maquina), horas: 9)
    get "/maquinas/#{maquina.id}/registros_uso"
    expect(response).to have_http_status(:ok)
    expect(json.map { |r| r["horas"] }).to eq([ 4.0 ])
  end

  it "registra horas e soma ao total da máquina" do
    post "/maquinas/#{maquina.id}/registros_uso", params: { registro_uso: { horas: 42.5, data: Time.zone.today.iso8601 } }.to_json, headers: headers
    expect(response).to have_http_status(:created)
    expect(json["horas"]).to eq(42.5)
    expect(maquina.reload.horas_uso_total).to eq(92.5)
    get "/maquinas/#{maquina.id}"
    expect(json["status_manutencao"]).to eq("proxima")
  end

  it "retorna 422 para horas inválidas e data futura" do
    post "/maquinas/#{maquina.id}/registros_uso", params: { registro_uso: { horas: 0, data: Time.zone.tomorrow.iso8601 } }.to_json, headers: headers
    expect(response).to have_http_status(:unprocessable_content)
    expect(json["errors"].keys).to contain_exactly("horas", "data")
    expect(maquina.reload.horas_uso_total).to eq(50)
  end

  it "retorna 404 quando a máquina não existe" do
    post "/maquinas/0/registros_uso", params: { registro_uso: { horas: 1, data: Time.zone.today.iso8601 } }.to_json, headers: headers
    expect(response).to have_http_status(:not_found)
    expect(json).to eq("error" => "Máquina não encontrada")
  end
end
