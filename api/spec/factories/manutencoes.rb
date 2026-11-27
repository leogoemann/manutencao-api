FactoryBot.define do
  factory :manutencao do
    maquina
    data { Time.zone.today }
    tipo { "preventiva" }
    descricao { "Inspeção geral" }
    responsavel { "Equipe de manutenção" }
    custo { 100 }
  end
end
