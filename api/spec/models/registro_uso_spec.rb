require "rails_helper"

RSpec.describe RegistroUso do
  let(:maquina) { create(:maquina, horas_uso_total: 10) }

  it "exige horas maiores que zero" do
    expect(build(:registro_uso, maquina: maquina, horas: 0)).not_to be_valid
  end

  it "não aceita data futura" do
    registro = build(:registro_uso, maquina: maquina, data: Time.zone.tomorrow)
    expect(registro).not_to be_valid
    expect(registro.errors[:data]).to include("não pode ser futura")
  end

  it "soma as horas ao total da máquina ao registrar" do
    described_class.registrar!(maquina, horas: 7.5, data: Time.zone.today)
    expect(maquina.reload.horas_uso_total).to eq(17.5)
  end

  it "não altera o total quando o registro é inválido" do
    expect { described_class.registrar!(maquina, horas: -1, data: Time.zone.today) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(maquina.reload.horas_uso_total).to eq(10)
  end
end
