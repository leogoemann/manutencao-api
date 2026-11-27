class RegistroUsoSerializer
  def self.call(registro)
    {
      id: registro.id,
      maquina_id: registro.maquina_id,
      horas: registro.horas.to_f,
      data: registro.data.iso8601,
      observacao: registro.observacao,
      created_at: registro.created_at&.iso8601
    }
  end
end
