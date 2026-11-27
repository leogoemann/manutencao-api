ActiveRecord::Schema[8.1].define(version: 2026_11_27_120200) do
  create_table "manutencoes", force: :cascade do |t|
    t.integer "maquina_id", null: false
    t.date "data", null: false
    t.string "tipo", null: false
    t.text "descricao"
    t.string "responsavel"
    t.decimal "horas_maquina", precision: 12, scale: 2, null: false
    t.decimal "custo", precision: 12, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["maquina_id", "tipo", "data"], name: "index_manutencoes_on_maquina_id_and_tipo_and_data"
    t.index ["maquina_id"], name: "index_manutencoes_on_maquina_id"
  end

  create_table "maquinas", force: :cascade do |t|
    t.string "nome", null: false
    t.string "codigo", null: false
    t.string "fabricante"
    t.string "modelo"
    t.string "localizacao"
    t.date "data_aquisicao"
    t.decimal "intervalo_manutencao_horas", precision: 12, scale: 2, null: false
    t.decimal "horas_uso_total", precision: 12, scale: 2, default: "0.0", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["codigo"], name: "index_maquinas_on_codigo", unique: true
  end

  create_table "registros_uso", force: :cascade do |t|
    t.integer "maquina_id", null: false
    t.decimal "horas", precision: 12, scale: 2, null: false
    t.date "data", null: false
    t.text "observacao"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["maquina_id", "data"], name: "index_registros_uso_on_maquina_id_and_data"
    t.index ["maquina_id"], name: "index_registros_uso_on_maquina_id"
  end

  add_foreign_key "manutencoes", "maquinas", on_delete: :cascade
  add_foreign_key "registros_uso", "maquinas", on_delete: :cascade
end
