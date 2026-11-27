class Manutencao < ApplicationRecord
  include DataNaoFutura

  TIPOS = %w[preventiva corretiva preditiva].freeze

  belongs_to :maquina

  before_validation :preencher_horas_maquina

  validates :data, presence: true
  validates :tipo, presence: true, inclusion: { in: TIPOS }
  validates :horas_maquina, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :custo, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validate :horas_maquina_dentro_do_uso_total

  scope :preventivas, -> { where(tipo: "preventiva") }
  scope :recentes_primeiro, -> { order(data: :desc, id: :desc) }

  private

  def preencher_horas_maquina
    self.horas_maquina = maquina.horas_uso_total if horas_maquina.nil? && maquina
  end

  def horas_maquina_dentro_do_uso_total
    return if maquina.nil? || horas_maquina.nil?
    return if horas_maquina <= maquina.horas_uso_total

    errors.add(:horas_maquina, :excede_horas_maquina)
  end
end
