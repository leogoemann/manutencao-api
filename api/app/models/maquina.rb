class Maquina < ApplicationRecord
  has_many :registros_uso, dependent: :destroy
  has_many :manutencoes, dependent: :destroy

  attribute :horas_uso_total, :decimal, default: 0

  normalizes :nome, :codigo, :fabricante, :modelo, :localizacao, with: ->(valor) { valor.strip.presence }

  validates :nome, presence: true
  validates :codigo, presence: true, uniqueness: { case_sensitive: false }
  validates :intervalo_manutencao_horas, presence: true, numericality: { greater_than: 0 }
  validates :horas_uso_total, presence: true, numericality: { greater_than_or_equal_to: 0 }

  def status_manutencao
    @status_manutencao ||= StatusManutencao.new(self)
  end

  def reload(*)
    @status_manutencao = nil
    super
  end
end
