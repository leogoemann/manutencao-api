require "rails_helper"

RSpec.describe "Máquinas", type: :request do
  let(:headers) { { "CONTENT_TYPE" => "application/json" } }

  describe "GET /maquinas" do
    it "lista máquinas com campos calculados e números como número JSON" do
      create(:maquina, nome: "Torno", intervalo_manutencao_horas: 100, horas_uso_total: 95)
      get "/maquinas"
      expect(response).to have_http_status(:ok)
      item = json.first
      expect(item).to include("nome" => "Torno", "horas_restantes" => 5.0, "status_manutencao" => "proxima", "ultima_manutencao_em" => nil)
      expect(item["intervalo_manutencao_horas"]).to be_a(Numeric)
      expect(json).to be_an(Array)
    end
  end

  describe "GET /maquinas/:id" do
    it "retorna a máquina" do
      maquina = create(:maquina)
      get "/maquinas/#{maquina.id}"
      expect(response).to have_http_status(:ok)
      expect(json["codigo"]).to eq(maquina.codigo)
    end

    it "retorna 404 no formato padrão" do
      get "/maquinas/999999"
      expect(response).to have_http_status(:not_found)
      expect(json).to eq("error" => "Máquina não encontrada")
    end
  end

  describe "POST /maquinas" do
    it "cria a máquina e retorna 201" do
      corpo = { maquina: { nome: "Prensa", codigo: "PRS-1", intervalo_manutencao_horas: 200, data_aquisicao: "2025-05-01" } }
      post "/maquinas", params: corpo.to_json, headers: headers
      expect(response).to have_http_status(:created)
      expect(json).to include("nome" => "Prensa", "horas_uso_total" => 0.0, "status_manutencao" => "em_dia", "data_aquisicao" => "2025-05-01")
    end

    it "retorna 422 com erros por campo" do
      create(:maquina, codigo: "DUP")
      post "/maquinas", params: { maquina: { nome: "", codigo: "DUP", intervalo_manutencao_horas: 0, horas_uso_total: -5 } }.to_json, headers: headers
      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"].keys).to contain_exactly("nome", "codigo", "intervalo_manutencao_horas", "horas_uso_total")
    end

    it "retorna 422 quando a chave raiz está ausente" do
      post "/maquinas", params: {}.to_json, headers: headers
      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]).to have_key("maquina")
    end

    it "retorna 400 sem stack trace para JSON malformado" do
      post "/maquinas", params: "{nome:", headers: headers
      expect(response).to have_http_status(:bad_request)
      expect(json).to eq("error" => "JSON inválido no corpo da requisição")
    end

    it "armazena HTML como texto sem interpretá-lo" do
      post "/maquinas", params: { maquina: { nome: "<script>alert(1)</script>", codigo: "XSS", intervalo_manutencao_horas: 10 } }.to_json, headers: headers
      expect(response).to have_http_status(:created)
      expect(response.body).not_to include("<script>")
      expect(json["nome"]).to eq("<script>alert(1)</script>")
    end
  end

  describe "PUT /maquinas/:id" do
    it "atualiza e retorna 200" do
      maquina = create(:maquina)
      put "/maquinas/#{maquina.id}", params: { maquina: { localizacao: "Linha 3" } }.to_json, headers: headers
      expect(response).to have_http_status(:ok)
      expect(json["localizacao"]).to eq("Linha 3")
    end

    it "retorna 422 para dados inválidos" do
      maquina = create(:maquina)
      put "/maquinas/#{maquina.id}", params: { maquina: { intervalo_manutencao_horas: -1 } }.to_json, headers: headers
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "retorna 404 para máquina inexistente" do
      put "/maquinas/0", params: { maquina: { nome: "X" } }.to_json, headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /maquinas/:id" do
    it "exclui a máquina e seus registros com 204" do
      maquina = create(:maquina, horas_uso_total: 10)
      create(:registro_uso, maquina: maquina)
      create(:manutencao, maquina: maquina)
      delete "/maquinas/#{maquina.id}"
      expect(response).to have_http_status(:no_content)
      expect(RegistroUso.count + Manutencao.count).to eq(0)
    end
  end

  describe "rotas desconhecidas" do
    it "retorna 404 em JSON" do
      get "/registros_uso"
      expect(response).to have_http_status(:not_found)
      expect(json).to eq("error" => "Rota não encontrada")
    end
  end
end
