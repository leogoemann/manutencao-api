class CreateMaquinas < ActiveRecord::Migration[8.1]
  def change
    create_table :maquinas do |t|
      t.string :nome, null: false
      t.string :codigo, null: false
      t.string :fabricante
      t.string :modelo
      t.string :localizacao
      t.date :data_aquisicao
      t.decimal :intervalo_manutencao_horas, precision: 12, scale: 2, null: false
      t.decimal :horas_uso_total, precision: 12, scale: 2, null: false, default: 0
      t.timestamps
    end
    add_index :maquinas, :codigo, unique: true
  end
end
