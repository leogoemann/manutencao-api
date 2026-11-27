class CreateManutencoes < ActiveRecord::Migration[8.1]
  def change
    create_table :manutencoes do |t|
      t.references :maquina, null: false, foreign_key: { on_delete: :cascade }
      t.date :data, null: false
      t.string :tipo, null: false
      t.text :descricao
      t.string :responsavel
      t.decimal :horas_maquina, precision: 12, scale: 2, null: false
      t.decimal :custo, precision: 12, scale: 2
      t.timestamps
    end
    add_index :manutencoes, %i[maquina_id tipo data]
  end
end
