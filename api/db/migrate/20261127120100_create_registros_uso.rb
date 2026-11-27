class CreateRegistrosUso < ActiveRecord::Migration[8.1]
  def change
    create_table :registros_uso do |t|
      t.references :maquina, null: false, foreign_key: { on_delete: :cascade }
      t.decimal :horas, precision: 12, scale: 2, null: false
      t.date :data, null: false
      t.text :observacao
      t.timestamps
    end
    add_index :registros_uso, %i[maquina_id data]
  end
end
