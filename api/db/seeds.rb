hoje = Time.zone.today

def uso(horas, dias_atras, observacao = "Apontamento de turno")
  [ :uso, horas, dias_atras, observacao ]
end

def manutencao(tipo, dias_atras, descricao, responsavel, custo)
  [ :manutencao, tipo, dias_atras, descricao, responsavel, custo ]
end

maquinas = [
  {
    atributos: { nome: "Torno CNC Romi", codigo: "TRN-001", fabricante: "Romi", modelo: "GL 240", localizacao: "Usinagem, linha 1", data_aquisicao: hoje - 900, intervalo_manutencao_horas: 500 },
    eventos: [ uso(300, 40), manutencao("preventiva", 40, "Troca de óleo e inspeção geral", "Equipe de Manutenção", 850), uso(120, 25), uso(80, 10) ]
  },
  {
    atributos: { nome: "Prensa Hidráulica Schuler", codigo: "PRS-002", fabricante: "Schuler", modelo: "PH-200", localizacao: "Estamparia", data_aquisicao: hoje - 1500, intervalo_manutencao_horas: 400 },
    eventos: [ uso(200, 60), uso(180, 20), manutencao("corretiva", 12, "Substituição de correia", "Carlos Lima", 320), uso(30, 3) ]
  },
  {
    atributos: { nome: "Compressor Atlas Copco", codigo: "CMP-003", fabricante: "Atlas Copco", modelo: "GA 30", localizacao: "Utilidades", data_aquisicao: hoje - 700, intervalo_manutencao_horas: 250 },
    eventos: [ uso(150, 50), uso(80, 15) ]
  },
  {
    atributos: { nome: "Centro de Usinagem Haas", codigo: "CUS-004", fabricante: "Haas", modelo: "VF-2", localizacao: "Usinagem, linha 2", data_aquisicao: hoje - 400, intervalo_manutencao_horas: 600 },
    eventos: [ uso(100, 30), manutencao("preventiva", 30, "Troca de óleo e inspeção geral", "Equipe de Manutenção", 850), uso(60, 5) ]
  },
  {
    atributos: { nome: "Injetora Plástica Romi", codigo: "INJ-005", fabricante: "Romi", modelo: "EN 260", localizacao: "Injeção", data_aquisicao: hoje - 1100, intervalo_manutencao_horas: 300 },
    eventos: [ uso(280, 120), manutencao("preventiva", 100, "Limpeza do cilindro e troca do óleo hidráulico", "Fernanda Souza", 1200), uso(150, 60), uso(120, 20) ]
  },
  {
    atributos: { nome: "Robô de Solda ABB", codigo: "RSD-006", fabricante: "ABB", modelo: "IRB 1600", localizacao: "Solda", data_aquisicao: hoje - 800, intervalo_manutencao_horas: 1000 },
    eventos: [ uso(600, 200), manutencao("preventiva", 180, "Calibração dos eixos e troca de graxa dos redutores", "Assistência técnica ABB", 3400), manutencao("corretiva", 90, "Troca da tocha de solda", "Rafael Martins", 780), uso(400, 60), uso(250, 10) ]
  },
  {
    atributos: { nome: "Ponte Rolante Demag 10 t", codigo: "PRL-007", fabricante: "Demag", modelo: "EKKE 10t", localizacao: "Expedição", data_aquisicao: hoje - 2200, intervalo_manutencao_horas: 250 },
    eventos: [ uso(120, 90), uso(150, 30, "Pico de carregamento de fim de mês") ]
  },
  {
    atributos: { nome: "Esteira Transportadora Interroll", codigo: "EST-008", fabricante: "Interroll", modelo: "CM 1000", localizacao: "Montagem", data_aquisicao: hoje - 600, intervalo_manutencao_horas: 800 },
    eventos: [ uso(500, 100), manutencao("preventiva", 95, "Alinhamento da correia e lubrificação dos roletes", "Equipe de Manutenção", 450), uso(300, 40) ]
  },
  {
    atributos: { nome: "Gerador Diesel Cummins", codigo: "GER-009", fabricante: "Cummins", modelo: "C150 D6", localizacao: "Utilidades", data_aquisicao: hoje - 1300, intervalo_manutencao_horas: 250 },
    eventos: [ uso(40, 60, "Teste semanal e queda de energia"), manutencao("preditiva", 30, "Análise de óleo do motor", "Laboratório Lubrifica", 180) ]
  },
  {
    atributos: { nome: "Retificadora Plana Mello", codigo: "RET-010", fabricante: "Mello", modelo: "P36", localizacao: "Ferramentaria", data_aquisicao: hoje - 2600, intervalo_manutencao_horas: 400 },
    eventos: [ uso(365, 50), manutencao("corretiva", 20, "Troca do rolamento do cabeçote", "Carlos Lima", 640) ]
  },
  {
    atributos: { nome: "Dobradeira CNC Newton", codigo: "DOB-011", fabricante: "Newton", modelo: "PHS 100", localizacao: "Caldeiraria", data_aquisicao: hoje - 1000, intervalo_manutencao_horas: 500 },
    eventos: [ uso(300, 150), manutencao("preventiva", 140, "Troca de filtros e verificação do sistema hidráulico", "Fernanda Souza", 980), uso(250, 60), uso(300, 5) ]
  },
  {
    atributos: { nome: "Fresadora Universal Diplomat", codigo: "FRE-012", fabricante: "Diplomat", modelo: "FVF 3000", localizacao: "Ferramentaria", data_aquisicao: hoje - 3000, intervalo_manutencao_horas: 600 },
    eventos: [ uso(100, 30) ]
  },
  {
    atributos: { nome: "Caldeira a Vapor ATA", codigo: "CAL-013", fabricante: "ATA", modelo: "MP-812", localizacao: "Utilidades", data_aquisicao: hoje - 3500, intervalo_manutencao_horas: 720 },
    eventos: [ uso(700, 300), manutencao("preventiva", 290, "Limpeza dos tubos e teste das válvulas de segurança", "Termotécnica Sul", 4200), manutencao("preditiva", 100, "Inspeção termográfica do isolamento", "Termotécnica Sul", 650), uso(650, 40) ]
  },
  {
    atributos: { nome: "Empilhadeira Elétrica Toyota", codigo: "EMP-014", fabricante: "Toyota", modelo: "8FBE20", localizacao: "Almoxarifado", data_aquisicao: hoje - 500, intervalo_manutencao_horas: 500 },
    eventos: [ uso(200, 45), manutencao("corretiva", 25, "Substituição de célula da bateria", "Rafael Martins", 1500), uso(180, 3) ]
  },
  {
    atributos: { nome: "Chiller Carrier", codigo: "CHL-015", fabricante: "Carrier", modelo: "30RB 060", localizacao: "Utilidades", data_aquisicao: hoje - 1900, intervalo_manutencao_horas: 2000 },
    eventos: [ uso(1200, 360), manutencao("preventiva", 350, "Limpeza dos condensadores e verificação de gás", "Clima Engenharia", 2800), uso(1500, 150), uso(520, 10) ]
  },
  {
    atributos: { nome: "Torno Convencional Nardini", codigo: "TRN-016", fabricante: "Nardini", modelo: "ND 220", localizacao: "Usinagem, linha 2", data_aquisicao: hoje - 7, intervalo_manutencao_horas: 400 },
    eventos: []
  }
]

ActiveRecord::Base.transaction do
  maquinas.each do |dados|
    maquina = Maquina.find_or_initialize_by(codigo: dados[:atributos][:codigo])
    next if maquina.persisted?

    maquina.update!(dados[:atributos])
    dados[:eventos].each do |evento|
      case evento.first
      when :uso
        _, horas, dias_atras, observacao = evento
        RegistroUso.registrar!(maquina, horas: horas, data: hoje - dias_atras, observacao: observacao)
      when :manutencao
        _, tipo, dias_atras, descricao, responsavel, custo = evento
        maquina.manutencoes.create!(data: hoje - dias_atras, tipo: tipo, descricao: descricao, responsavel: responsavel, custo: custo)
      end
    end
  end
end
