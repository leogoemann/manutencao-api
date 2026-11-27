require "rails_helper"

RSpec.describe Maquina do
  it "é válida com os atributos da factory" do
    expect(build(:maquina)).to be_valid
  end

  it "exige nome e código" do
    maquina = build(:maquina, nome: "", codigo: nil)
    expect(maquina).not_to be_valid
    expect(maquina.errors[:nome]).to include("não pode ficar em branco")
    expect(maquina.errors[:codigo]).to include("não pode ficar em branco")
  end

  it "exige código único sem diferenciar maiúsculas" do
    create(:maquina, codigo: "ABC-1")
    maquina = build(:maquina, codigo: "abc-1")
    expect(maquina).not_to be_valid
    expect(maquina.errors[:codigo]).to include("já está em uso")
  end

  it "exige intervalo maior que zero" do
    expect(build(:maquina, intervalo_manutencao_horas: 0)).not_to be_valid
  end

  it "não aceita horas de uso negativas" do
    expect(build(:maquina, horas_uso_total: -1)).not_to be_valid
  end

  it "começa com horas de uso igual a zero" do
    expect(described_class.new.horas_uso_total).to eq(0)
  end

  it "remove espaços extras dos campos de texto" do
    expect(create(:maquina, codigo: "  X-9  ").codigo).to eq("X-9")
  end

  it "exclui registros de uso e manutenções junto com a máquina" do
    maquina = create(:maquina, horas_uso_total: 10)
    create(:registro_uso, maquina: maquina)
    create(:manutencao, maquina: maquina)
    expect { maquina.destroy }.to change(RegistroUso, :count).by(-1).and change(Manutencao, :count).by(-1)
  end
end
