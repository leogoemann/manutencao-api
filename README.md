# Horímetro – Manutenção Preventiva

Sistema de controle de manutenção preventiva de máquinas industriais: cadastro de máquinas, apontamento de horas de uso, registro de manutenções e alertas quando a preventiva está próxima ou atrasada.

```
manutencao-preventiva/
├── api/                 API REST em Ruby on Rails 8.1 (SQLite, porta 3001)
├── web/                 Interface web em React + Vite (porta 5173)
├── docs/DAS.md          Documento de Arquitetura de Sistemas
└── .github/workflows/   CI no GitHub Actions
```

## Requisitos

- Ruby 3.4 (recomendado 3.4.13 ou mais recente) e Bundler
- Node.js 20+ e npm
- SQLite 3

## Como rodar

### API

```bash
cd api
bundle install
bin/rails db:prepare      # cria o banco, roda as migrations e os seeds
bin/rails server          # http://localhost:3001
```

Os seeds criam quatro máquinas cobrindo os três status (em dia, próxima e atrasada). Para recriar os dados: `bin/rails db:seed:replant`.

Documentação Swagger (somente em desenvolvimento/teste): http://localhost:3001/api-docs

### Interface web

```bash
cd web
npm install
cp .env.example .env      # opcional: VITE_API_URL, padrão http://localhost:3001
npm run dev               # http://localhost:5173
```

## Fluxo do sistema

O sistema segue as quatro etapas do protótipo de demonstração gerado no Autom Hub:

1. **Cadastro de máquina** com o intervalo da preventiva em horas.
2. **Apontamento de horas de uso**, manual ou por importação de CSV (`codigo;horas;data;observacao`).
3. **Processamento das regras de limite** a cada consulta.
4. **Alerta** de manutenção próxima ou atrasada.

### Regras de negócio

- `horas_desde_ultima_manutencao = horas_uso_total − horas_maquina da última preventiva` (ou `horas_uso_total` se nunca houve preventiva)
- `horas_restantes = intervalo_manutencao_horas − horas_desde_ultima_manutencao`
- **atrasada** se `horas_restantes <= 0`; **proxima** se `horas_restantes <= 10%` do intervalo; senão **em_dia**
- Apenas manutenção **preventiva** reinicia a contagem; corretiva e preditiva ficam só no histórico
- Registrar horas soma ao `horas_uso_total` da máquina na mesma transação
- Datas de uso e manutenção não podem ser futuras; horas > 0; custo ≥ 0
- Excluir a máquina exclui seus registros de uso e manutenções

## Endpoints

| Método | Rota | Descrição | Sucesso |
|---|---|---|---|
| GET | `/maquinas` | Lista máquinas com status calculado | 200 |
| POST | `/maquinas` | Cadastra máquina | 201 |
| GET | `/maquinas/:id` | Detalha máquina | 200 |
| PUT | `/maquinas/:id` | Atualiza máquina | 200 |
| DELETE | `/maquinas/:id` | Exclui máquina e histórico | 204 |
| GET | `/maquinas/:maquina_id/registros_uso` | Lista horas apontadas | 200 |
| POST | `/maquinas/:maquina_id/registros_uso` | Aponta horas de uso | 201 |
| GET | `/maquinas/:maquina_id/manutencoes` | Lista manutenções (`?tipo=`) | 200 |
| POST | `/maquinas/:maquina_id/manutencoes` | Registra manutenção | 201 |
| GET | `/alertas` | Alertas (`?status=proxima\|atrasada\|em_dia`) | 200 |
| GET | `/up` | Healthcheck | 200 |

Os corpos usam chave raiz (`maquina`, `registro_uso`, `manutencao`). Erros:

```json
422 { "errors": { "campo": ["mensagem"] } }
404 { "error": "Máquina não encontrada" }
```

Exemplo:

```bash
curl -X POST http://localhost:3001/maquinas/1/registros_uso \
  -H "Content-Type: application/json" \
  -d '{"registro_uso": {"horas": 8, "data": "2026-11-27", "observacao": "Turno A"}}'
```

## Qualidade e testes

```bash
cd api
bundle exec rspec                         # unitários + integração, cobertura mínima 70% (SimpleCov)
bundle exec rake rswag:specs:swaggerize   # regenera swagger/v1/swagger.yaml
bin/rubocop                               # lint (rails-omakase)
bin/brakeman                              # SAST
bin/bundler-audit check --update          # vulnerabilidades em dependências

cd ../web
npm run lint
npm run build
```

A coleção Postman fica em `api/postman/manutencao-preventiva.postman_collection.json` e pode rodar com Newman:

```bash
npx newman run api/postman/manutencao-preventiva.postman_collection.json
```

## Segurança

Controles aplicados a partir dos achados da avaliação da plataforma Architetto:

| Achado | Controle nesta implementação |
|---|---|
| ARC-001 OpenAPI exposta | Swagger montado apenas em desenvolvimento/teste (ou com `EXPOSE_API_DOCS=true`) |
| ARC-003 ambiente dev em produção | Configuração de produção separada, `force_ssl`, `APP_HOSTS` para host authorization |
| ARC-004 vazamento de stack trace | `rescue_from` global devolve `{"error": "Erro interno do servidor"}` e registra o detalhe só no log; JSON malformado responde 400 |
| ARC-012 injeção HTML/JS | Respostas JSON escapam `<`, `>` e `&`; o React escapa todo texto renderizado |
| CORS | Em desenvolvimento só `localhost`/`127.0.0.1`; em produção apenas as origens de `CORS_ORIGINS` |

O draft define `authType: none`, então a API não tem autenticação. Antes de expor em rede pública, adicione autenticação (ver DAS, seção 12).

## Variáveis de ambiente (produção)

| Variável | Uso |
|---|---|
| `RAILS_MASTER_KEY` | Chave das credenciais do Rails |
| `CORS_ORIGINS` | Origens permitidas, separadas por vírgula |
| `APP_HOSTS` | Hosts aceitos pela aplicação |
| `EXPOSE_API_DOCS` | `true` para expor o Swagger |
| `PORT` | Porta do servidor (padrão 3001) |
| `VITE_API_URL` | URL da API usada no build do frontend |
