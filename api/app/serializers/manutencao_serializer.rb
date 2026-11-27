class ManutencaoSerializer
  def self.call(manutencao)
    {
      id: manutencao.id,
      maquina_id: manutencao.maquina_id,
      data: manutencao.data.iso8601,
      tipo: manutencao.tipo,
      descricao: manutencao.descricao,
      responsavel: manutencao.responsavel,
      horas_maquina: manutencao.horas_maquina.to_f,
      custo: manutencao.custo&.to_f,
      created_at: manutencao.created_at&.iso8601
    }
  end
end
