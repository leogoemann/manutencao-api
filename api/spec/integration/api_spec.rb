require "swagger_helper"

RSpec.describe "Manutenção Preventiva API", type: :request do
  let(:maquina_existente) { create(:maquina, intervalo_manutencao_horas: 100, horas_uso_total: 95) }

  path "/maquinas" do
    get "Listar máquinas com status de manutenção" do
      tags "Máquinas"
      produces "application/json"
      response "200", "lista de máquinas" do
        schema type: :array, items: { "$ref" => "#/components/schemas/maquina" }
        before { maquina_existente }
        run_test!
      end
    end

    post "Cadastrar máquina" do
      tags "Máquinas"
      consumes "application/json"
      produces "application/json"
      parameter name: :corpo, in: :body, schema: { "$ref" => "#/components/schemas/maquina_entrada" }

      response "201", "máquina criada" do
        schema "$ref" => "#/components/schemas/maquina"
        let(:corpo) { { maquina: { nome: "Torno", codigo: "TRN-9", intervalo_manutencao_horas: 500 } } }
        run_test!
      end

      response "422", "dados inválidos" do
        schema "$ref" => "#/components/schemas/erros_validacao"
        let(:corpo) { { maquina: { nome: "", codigo: "", intervalo_manutencao_horas: 0 } } }
        run_test!
      end
    end
  end

  path "/maquinas/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Detalhar máquina" do
      tags "Máquinas"
      produces "application/json"
      response "200", "máquina encontrada" do
        schema "$ref" => "#/components/schemas/maquina"
        let(:id) { maquina_existente.id }
        run_test!
      end
      response "404", "máquina não encontrada" do
        schema "$ref" => "#/components/schemas/erro"
        let(:id) { 0 }
        run_test!
      end
    end

    put "Atualizar máquina" do
      tags "Máquinas"
      consumes "application/json"
      produces "application/json"
      parameter name: :corpo, in: :body, schema: { "$ref" => "#/components/schemas/maquina_entrada" }
      response "200", "máquina atualizada" do
        schema "$ref" => "#/components/schemas/maquina"
        let(:id) { maquina_existente.id }
        let(:corpo) { { maquina: { localizacao: "Linha 2" } } }
        run_test!
      end
      response "422", "dados inválidos" do
        schema "$ref" => "#/components/schemas/erros_validacao"
        let(:id) { maquina_existente.id }
        let(:corpo) { { maquina: { intervalo_manutencao_horas: 0 } } }
        run_test!
      end
    end

    delete "Excluir máquina" do
      tags "Máquinas"
      response "204", "máquina excluída" do
        let(:id) { maquina_existente.id }
        run_test!
      end
    end
  end

  path "/maquinas/{maquina_id}/registros_uso" do
    parameter name: :maquina_id, in: :path, type: :integer

    get "Listar registros de uso da máquina" do
      tags "Registros de uso"
      produces "application/json"
      response "200", "registros de uso" do
        schema type: :array, items: { "$ref" => "#/components/schemas/registro_uso" }
        let(:maquina_id) { create(:registro_uso, maquina: maquina_existente).maquina_id }
        run_test!
      end
    end

    post "Registrar horas de uso" do
      tags "Registros de uso"
      consumes "application/json"
      produces "application/json"
      parameter name: :corpo, in: :body, schema: { "$ref" => "#/components/schemas/registro_uso_entrada" }
      response "201", "horas registradas" do
        schema "$ref" => "#/components/schemas/registro_uso"
        let(:maquina_id) { maquina_existente.id }
        let(:corpo) { { registro_uso: { horas: 8, data: Time.zone.today.iso8601, observacao: "Turno A" } } }
        run_test!
      end
      response "422", "dados inválidos" do
        schema "$ref" => "#/components/schemas/erros_validacao"
        let(:maquina_id) { maquina_existente.id }
        let(:corpo) { { registro_uso: { horas: 0, data: Time.zone.today.iso8601 } } }
        run_test!
      end
      response "404", "máquina não encontrada" do
        schema "$ref" => "#/components/schemas/erro"
        let(:maquina_id) { 0 }
        let(:corpo) { { registro_uso: { horas: 1, data: Time.zone.today.iso8601 } } }
        run_test!
      end
    end
  end

  path "/maquinas/{maquina_id}/manutencoes" do
    parameter name: :maquina_id, in: :path, type: :integer

    get "Listar manutenções da máquina" do
      tags "Manutenções"
      produces "application/json"
      parameter name: :tipo, in: :query, required: false, schema: { type: :string, enum: %w[preventiva corretiva preditiva] }
      response "200", "manutenções" do
        schema type: :array, items: { "$ref" => "#/components/schemas/manutencao" }
        let(:maquina_id) { create(:manutencao, maquina: maquina_existente).maquina_id }
        let(:tipo) { nil }
        run_test!
      end
    end

    post "Registrar manutenção" do
      tags "Manutenções"
      consumes "application/json"
      produces "application/json"
      parameter name: :corpo, in: :body, schema: { "$ref" => "#/components/schemas/manutencao_entrada" }
      response "201", "manutenção registrada" do
        schema "$ref" => "#/components/schemas/manutencao"
        let(:maquina_id) { maquina_existente.id }
        let(:corpo) { { manutencao: { data: Time.zone.today.iso8601, tipo: "preventiva", responsavel: "Ana", custo: 500 } } }
        run_test!
      end
      response "422", "dados inválidos" do
        schema "$ref" => "#/components/schemas/erros_validacao"
        let(:maquina_id) { maquina_existente.id }
        let(:corpo) { { manutencao: { data: Time.zone.today.iso8601, tipo: "invalida" } } }
        run_test!
      end
    end
  end

  path "/alertas" do
    get "Listar alertas de manutenção" do
      tags "Alertas"
      produces "application/json"
      parameter name: :status, in: :query, required: false, schema: { type: :string, enum: %w[proxima atrasada em_dia] }
      response "200", "alertas" do
        schema type: :array, items: { "$ref" => "#/components/schemas/alerta" }
        let(:status) { nil }
        before { maquina_existente }
        run_test!
      end
      response "422", "status inválido" do
        schema "$ref" => "#/components/schemas/erros_validacao"
        let(:status) { "x" }
        run_test!
      end
    end
  end
end
