class MaquinaSerializer
  def self.call(maquina)
    {
      id: maquina.id,
      nome: maquina.nome,
      codigo: maquina.codigo,
      fabricante: maquina.fabricante,
      modelo: maquina.modelo,
      localizacao: maquina.localizacao,
      data_aquisicao: maquina.data_aquisicao&.iso8601,
      intervalo_manutencao_horas: maquina.intervalo_manutencao_horas.to_f,
      horas_uso_total: maquina.horas_uso_total.to_f,
      created_at: maquina.created_at&.iso8601,
      updated_at: maquina.updated_at&.iso8601
    }.merge(maquina.status_manutencao.to_h)
  end
end
