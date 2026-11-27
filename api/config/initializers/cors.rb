origens_permitidas =
  if ENV["CORS_ORIGINS"].present?
    ENV["CORS_ORIGINS"].split(",").map(&:strip)
  elsif Rails.env.local?
    [ %r{\Ahttp://(localhost|127\.0\.0\.1)(:\d+)?\z} ]
  else
    []
  end

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*origens_permitidas)
    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head],
      max_age: 600
  end
end
