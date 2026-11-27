class AlertaSerializer
  def self.call(maquina)
    status = maquina.status_manutencao
    {
      maquina_id: maquina.id,
      maquina_nome: maquina.nome,
      maquina_codigo: maquina.codigo,
      status: status.status,
      mensagem: status.mensagem,
      horas_restantes: status.horas_restantes.to_f,
      horas_desde_ultima_manutencao: status.horas_desde_ultima_manutencao.to_f
    }
  end
end
