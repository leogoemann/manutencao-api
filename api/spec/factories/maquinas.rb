FactoryBot.define do
  factory :maquina do
    sequence(:nome) { |n| "Máquina #{n}" }
    sequence(:codigo) { |n| "MAQ-#{n.to_s.rjust(3, '0')}" }
    fabricante { "Romi" }
    modelo { "GL 240" }
    localizacao { "Linha 1" }
    data_aquisicao { Date.new(2024, 1, 10) }
    intervalo_manutencao_horas { 100 }
    horas_uso_total { 0 }
  end
end
