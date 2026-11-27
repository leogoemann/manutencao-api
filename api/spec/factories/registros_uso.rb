FactoryBot.define do
  factory :registro_uso do
    maquina
    horas { 8 }
    data { Time.zone.today }
    observacao { "Turno A" }
  end
end
