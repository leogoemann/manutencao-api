require "rails_helper"

RSpec.configure do |config|
  config.openapi_root = Rails.root.join("swagger").to_s
  config.openapi_format = :yaml
  config.openapi_specs = {
    "v1/swagger.yaml" => {
      openapi: "3.0.1",
      info: {
        title: "Manutenção Preventiva API",
        version: "v1",
        description: "API para cadastro de máquinas industriais, registro de horas de uso e manutenções, e emissão de alertas de manutenção preventiva próxima ou atrasada."
      },
      servers: [ { url: "http://localhost:3001" } ],
      paths: {},
      components: {
        schemas: {
          maquina_entrada: {
            type: :object,
            properties: {
              maquina: {
                type: :object,
                properties: {
                  nome: { type: :string },
                  codigo: { type: :string },
                  fabricante: { type: :string, nullable: true },
                  modelo: { type: :string, nullable: true },
                  localizacao: { type: :string, nullable: true },
                  data_aquisicao: { type: :string, format: :date, nullable: true },
                  intervalo_manutencao_horas: { type: :number },
                  horas_uso_total: { type: :number }
                },
                required: %w[nome codigo intervalo_manutencao_horas]
              }
            },
            required: %w[maquina]
          },
          maquina: {
            type: :object,
            properties: {
              id: { type: :integer },
              nome: { type: :string },
              codigo: { type: :string },
              fabricante: { type: :string, nullable: true },
              modelo: { type: :string, nullable: true },
              localizacao: { type: :string, nullable: true },
              data_aquisicao: { type: :string, format: :date, nullable: true },
              intervalo_manutencao_horas: { type: :number },
              horas_uso_total: { type: :number },
              horas_desde_ultima_manutencao: { type: :number },
              horas_restantes: { type: :number },
              ultima_manutencao_em: { type: :string, format: :date, nullable: true },
              status_manutencao: { type: :string, enum: %w[em_dia proxima atrasada] }
            },
            required: %w[id nome codigo intervalo_manutencao_horas horas_uso_total horas_desde_ultima_manutencao horas_restantes status_manutencao]
          },
          registro_uso_entrada: {
            type: :object,
            properties: {
              registro_uso: {
                type: :object,
                properties: {
                  horas: { type: :number },
                  data: { type: :string, format: :date },
                  observacao: { type: :string, nullable: true }
                },
                required: %w[horas data]
              }
            },
            required: %w[registro_uso]
          },
          registro_uso: {
            type: :object,
            properties: {
              id: { type: :integer },
              maquina_id: { type: :integer },
              horas: { type: :number },
              data: { type: :string, format: :date },
              observacao: { type: :string, nullable: true }
            },
            required: %w[id maquina_id horas data]
          },
          manutencao_entrada: {
            type: :object,
            properties: {
              manutencao: {
                type: :object,
                properties: {
                  data: { type: :string, format: :date },
                  tipo: { type: :string, enum: %w[preventiva corretiva preditiva] },
                  descricao: { type: :string, nullable: true },
                  responsavel: { type: :string, nullable: true },
                  horas_maquina: { type: :number, nullable: true },
                  custo: { type: :number, nullable: true }
                },
                required: %w[data tipo]
              }
            },
            required: %w[manutencao]
          },
          manutencao: {
            type: :object,
            properties: {
              id: { type: :integer },
              maquina_id: { type: :integer },
              data: { type: :string, format: :date },
              tipo: { type: :string, enum: %w[preventiva corretiva preditiva] },
              descricao: { type: :string, nullable: true },
              responsavel: { type: :string, nullable: true },
              horas_maquina: { type: :number },
              custo: { type: :number, nullable: true }
            },
            required: %w[id maquina_id data tipo horas_maquina]
          },
          alerta: {
            type: :object,
            properties: {
              maquina_id: { type: :integer },
              maquina_nome: { type: :string },
              maquina_codigo: { type: :string },
              status: { type: :string, enum: %w[em_dia proxima atrasada] },
              mensagem: { type: :string },
              horas_restantes: { type: :number },
              horas_desde_ultima_manutencao: { type: :number }
            },
            required: %w[maquina_id maquina_nome status mensagem horas_restantes horas_desde_ultima_manutencao]
          },
          erros_validacao: {
            type: :object,
            properties: {
              errors: { type: :object, additionalProperties: { type: :array, items: { type: :string } } }
            },
            required: %w[errors]
          },
          erro: {
            type: :object,
            properties: { error: { type: :string } },
            required: %w[error]
          }
        }
      }
    }
  }
end
