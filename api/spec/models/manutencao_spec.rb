require "rails_helper"

RSpec.describe Manutencao do
  let(:maquina) { create(:maquina, horas_uso_total: 50) }

  it "aceita apenas tipos válidos" do
    expect(build(:manutencao, maquina: maquina, tipo: "emergencial")).not_to be_valid
    Manutencao::TIPOS.each { |tipo| expect(build(:manutencao, maquina: maquina, tipo: tipo)).to be_valid }
  end

  it "não aceita data futura" do
    expect(build(:manutencao, maquina: maquina, data: Time.zone.tomorrow)).not_to be_valid
  end

  it "usa as horas atuais da máquina quando horas_maquina não é informado" do
    expect(create(:manutencao, maquina: maquina).horas_maquina).to eq(50)
  end

  it "não aceita custo negativo" do
    expect(build(:manutencao, maquina: maquina, custo: -1)).not_to be_valid
  end

  it "não aceita horas_maquina acima do uso total" do
    manutencao = build(:manutencao, maquina: maquina, horas_maquina: 60)
    expect(manutencao).not_to be_valid
    expect(manutencao.errors[:horas_maquina]).to include("não pode ser maior que as horas de uso da máquina")
  end
end
