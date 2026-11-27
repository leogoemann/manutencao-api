hoje = Time.zone.today

maquinas = [
  {
    atributos: { nome: "Torno CNC Romi", codigo: "TRN-001", fabricante: "Romi", modelo: "GL 240", localizacao: "Usinagem, linha 1", data_aquisicao: hoje - 900, intervalo_manutencao_horas: 500 },
    usos: [ [ 300, 40 ], [ 120, 25 ], [ 80, 10 ] ],
    preventiva_em_horas: 300
  },
  {
    atributos: { nome: "Prensa Hidráulica Schuler", codigo: "PRS-002", fabricante: "Schuler", modelo: "PH-200", localizacao: "Estamparia", data_aquisicao: hoje - 1500, intervalo_manutencao_horas: 400 },
    usos: [ [ 200, 60 ], [ 180, 20 ], [ 30, 3 ] ],
    preventiva_em_horas: nil
  },
  {
    atributos: { nome: "Compressor Atlas Copco", codigo: "CMP-003", fabricante: "Atlas Copco", modelo: "GA 30", localizacao: "Utilidades", data_aquisicao: hoje - 700, intervalo_manutencao_horas: 250 },
    usos: [ [ 150, 50 ], [ 80, 15 ] ],
    preventiva_em_horas: nil
  },
  {
    atributos: { nome: "Centro de Usinagem Haas", codigo: "CUS-004", fabricante: "Haas", modelo: "VF-2", localizacao: "Usinagem, linha 2", data_aquisicao: hoje - 400, intervalo_manutencao_horas: 600 },
    usos: [ [ 100, 30 ], [ 60, 5 ] ],
    preventiva_em_horas: 100
  }
]

ActiveRecord::Base.transaction do
  maquinas.each do |dados|
    maquina = Maquina.find_or_initialize_by(codigo: dados[:atributos][:codigo])
    next if maquina.persisted?

    maquina.update!(dados[:atributos])
    dados[:usos].each do |horas, dias_atras|
      RegistroUso.registrar!(maquina, horas: horas, data: hoje - dias_atras, observacao: "Apontamento de turno")
      if dados[:preventiva_em_horas] && maquina.horas_uso_total == dados[:preventiva_em_horas]
        maquina.manutencoes.create!(data: hoje - dias_atras, tipo: "preventiva", descricao: "Troca de óleo e inspeção geral", responsavel: "Equipe de Manutenção", custo: 850)
      end
    end
    maquina.manutencoes.create!(data: hoje - 12, tipo: "corretiva", descricao: "Substituição de correia", responsavel: "Carlos Lima", custo: 320) if maquina.codigo == "PRS-002"
  end
end
