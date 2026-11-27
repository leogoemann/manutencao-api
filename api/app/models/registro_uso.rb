class RegistroUso < ApplicationRecord
  include DataNaoFutura

  belongs_to :maquina

  validates :horas, presence: true, numericality: { greater_than: 0 }
  validates :data, presence: true

  def self.registrar!(maquina, atributos)
    transaction do
      maquina.lock!
      registro = maquina.registros_uso.create!(atributos)
      maquina.update!(horas_uso_total: maquina.horas_uso_total + registro.horas)
      registro
    end
  end
end
