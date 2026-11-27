module DataNaoFutura
  extend ActiveSupport::Concern

  included do
    validate :data_nao_pode_ser_futura
  end

  private

  def data_nao_pode_ser_futura
    errors.add(:data, :data_futura) if data.present? && data > Time.zone.today
  end
end
