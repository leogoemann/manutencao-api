require "rails_helper"

RSpec.describe StatusManutencao do
  let(:maquina) { create(:maquina, intervalo_manutencao_horas: 100, horas_uso_total: 0) }

  def status_com_horas(horas)
    maquina.update!(horas_uso_total: horas)
    described_class.new(maquina.reload)
  end

  it "está em dia quando as horas restantes passam de 10% do intervalo" do
    status = status_com_horas(89)
    expect(status.horas_restantes).to eq(11)
    expect(status.status).to eq("em_dia")
  end

  it "fica próxima exatamente no limite de 10% do intervalo" do
    status = status_com_horas(90)
    expect(status.horas_restantes).to eq(10)
    expect(status.status).to eq("proxima")
  end

  it "fica próxima com horas restantes positivas abaixo de 10%" do
    expect(status_com_horas(99.5).status).to eq("proxima")
  end

  it "fica atrasada exatamente com 0 h restantes" do
    status = status_com_horas(100)
    expect(status.horas_restantes).to eq(0)
    expect(status.status).to eq("atrasada")
  end

  it "fica atrasada com horas restantes negativas" do
    status = status_com_horas(135)
    expect(status.status).to eq("atrasada")
    expect(status.mensagem).to eq("Manutenção atrasada em 35 h")
  end

  it "gera mensagem de horas faltantes" do
    expect(status_com_horas(80).mensagem).to eq("Faltam 20 h para a manutenção")
  end

  it "formata horas fracionadas na mensagem" do
    expect(status_com_horas(80.5).mensagem).to eq("Faltam 19.5 h para a manutenção")
  end

  it "conta a partir da última manutenção preventiva" do
    maquina.update!(horas_uso_total: 150)
    create(:manutencao, maquina: maquina, tipo: "preventiva", horas_maquina: 120, data: Date.new(2026, 1, 10))
    status = described_class.new(maquina.reload)
    expect(status.horas_desde_ultima_manutencao).to eq(30)
    expect(status.horas_restantes).to eq(70)
    expect(status.ultima_manutencao_em).to eq(Date.new(2026, 1, 10))
  end

  it "ignora manutenções corretivas e preditivas" do
    maquina.update!(horas_uso_total: 150)
    create(:manutencao, maquina: maquina, tipo: "corretiva", horas_maquina: 140)
    create(:manutencao, maquina: maquina, tipo: "preditiva", horas_maquina: 145)
    status = described_class.new(maquina.reload)
    expect(status.horas_desde_ultima_manutencao).to eq(150)
    expect(status.ultima_manutencao_em).to be_nil
    expect(status.status).to eq("atrasada")
  end

  it "usa a preventiva mais recente quando há várias" do
    maquina.update!(horas_uso_total: 300)
    create(:manutencao, maquina: maquina, horas_maquina: 100, data: Date.new(2026, 1, 1))
    create(:manutencao, maquina: maquina, horas_maquina: 250, data: Date.new(2026, 3, 1))
    expect(described_class.new(maquina.reload).horas_desde_ultima_manutencao).to eq(50)
  end

  it "usa manutenções pré-carregadas sem nova consulta" do
    maquina.update!(horas_uso_total: 50)
    create(:manutencao, maquina: maquina, horas_maquina: 40)
    carregada = Maquina.includes(:manutencoes).find(maquina.id)
    expect(described_class.new(carregada).horas_desde_ultima_manutencao).to eq(10)
  end
end
