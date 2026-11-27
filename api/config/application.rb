require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_view/railtie"

Bundler.require(*Rails.groups)

module Api
  class Application < Rails::Application
    config.load_defaults 8.1
    config.autoload_lib(ignore: %w[assets tasks])
    config.api_only = true
    config.time_zone = "America/Sao_Paulo"
    config.i18n.default_locale = :"pt-BR"
    config.i18n.available_locales = [ :"pt-BR", :en ]
    config.action_dispatch.show_exceptions = :all
    config.exceptions_app = lambda do |env|
      status = env["PATH_INFO"].to_s.delete_prefix("/").to_i
      status = 500 unless status.between?(400, 599)
      mensagem = status == 500 ? "Erro interno do servidor" : Rack::Utils::HTTP_STATUS_CODES.fetch(status, "Erro")
      [ status, { "content-type" => "application/json; charset=utf-8" }, [ { error: mensagem }.to_json ] ]
    end
  end
end
