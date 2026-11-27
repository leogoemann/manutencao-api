Rails.application.routes.draw do
  if Rails.env.local? || ENV["EXPOSE_API_DOCS"] == "true"
    mount Rswag::Ui::Engine => "/api-docs"
    mount Rswag::Api::Engine => "/api-docs"
  end

  get "up" => "rails/health#show", as: :rails_health_check

  resources :maquinas, only: %i[index show create update destroy] do
    resources :registros_uso, only: %i[index create]
    resources :manutencoes, only: %i[index create]
  end

  get "alertas" => "alertas#index"

  match "*path", to: "application#rota_nao_encontrada", via: :all
end
