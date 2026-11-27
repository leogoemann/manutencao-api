# DAS – Documento de Arquitetura de Sistemas

| Campo | Valor |
|---|---|
| Projeto | Horímetro – Manutenção Preventiva (`manutencao-preventiva-api`) |
| Versão | 1.0 |
| Status | Em revisão |
| Responsável | Equipe do projeto |
| Data | 27/11/2026 |

## Controle do documento

| Versão | Data | Autor | Alteração | Aprovador |
|---|---|---|---|---|
| 0.1 | 27/10/2026 | Equipe | Draft da API no Architetto | – |
| 1.0 | 27/11/2026 | Equipe | Implementação da API e da interface web | [pendente] |

Classificação: Interno. Público-alvo: Engenharia, Operações de manutenção, Avaliadores. Repositório: `github.com/leogoemann/manutencao-api`. Revisão: por release.

## 1. Objetivo e escopo

Este DAS descreve a arquitetura do sistema de manutenção preventiva de máquinas industriais, composto por uma API REST (Ruby on Rails) e uma interface web (React). Cobre os ambientes de desenvolvimento, teste e produção.

Fora de escopo: autenticação e autorização de usuários, integração com ERP ou coletores IoT, algoritmos de manutenção preditiva, CD automatizado, observabilidade com Prometheus/Grafana.

Documentos relacionados: draft `manutencao-preventiva-api-draft.json` (Architetto), apresentação "Avaliação da Plataforma Architetto", README do projeto.

## 2. Resumo executivo

**Problema:** falta de controle centralizado, ausência de histórico rigoroso de horas de uso e paradas não planejadas que elevam custos.

**Solução:** uma API REST que guarda máquinas, horas de uso e manutenções e calcula, a cada consulta, quanto falta para a próxima preventiva. A interface web segue o fluxo do protótipo de demonstração gerado no Autom Hub: cadastro → apontamento de horas → regras de limite → alerta.

**Tecnologias:** Ruby 3.4, Rails 8.1 (modo API), SQLite, RSpec, rswag; React 19, Vite.

**Decisões principais:** status calculado em tempo de leitura (sem tabela de alertas); rotas aninhadas na máquina; serviço único `StatusManutencao` com a regra de negócio; monólito simples sem filas.

**Riscos:** ausência de autenticação; SQLite limita escrita concorrente; versão do Ruby local precisa ser atualizada (CVE-2026-132825 apontada pelo Brakeman em 3.4.9).

## 3. Contexto de negócio

| Item | Descrição |
|---|---|
| Objetivos | Reduzir paradas não planejadas; manter histórico confiável de intervenções |
| Capacidades | Cadastro de equipamentos, registro de horas, registro de manutenções, consulta de histórico, alertas |
| Usuários | Técnicos de manutenção (apontam horas e registram serviços) e supervisores (acompanham alertas e custos) |
| Indicadores | % da frota com preventiva atrasada; custo de manutenção por tipo; tempo de resposta da API < 200 ms (p95) |

### Rastreabilidade

| Requisito | Descrição | Implementação |
|---|---|---|
| RF-01 | CRUD de equipamentos | `MaquinasController`, tela Máquinas |
| RF-02 | Registro contínuo de horas | `POST /maquinas/:id/registros_uso`, tela Apontar horas (manual e CSV) |
| RF-03 | Registro formal de manutenções | `POST /maquinas/:id/manutencoes`, tela Manutenções |
| RF-04 | Consulta de histórico | `GET` aninhados, linha do tempo no detalhe da máquina |
| RF-05 | Motor de cálculo de atraso | `app/services/status_manutencao.rb`, `GET /alertas` |
| RF-06 | REST com payload JSON | Rails API, respostas JSON sem envelope |

## 4. Contexto sistêmico

```
 Técnico / Supervisor
        │ navegador (HTTPS)
        ▼
 ┌──────────────┐   JSON/HTTP   ┌──────────────────┐   ActiveRecord   ┌──────────┐
 │  Web (React) │ ────────────▶ │  API Rails 8.1   │ ───────────────▶ │  SQLite  │
 └──────────────┘               └──────────────────┘                  └──────────┘
        ▲                                ▲
   planilha CSV                   clientes HTTP (Postman, coletores)
```

Pertence à solução: cadastro, cálculo de status e histórico. Não pertence: emissão de ordens de serviço, estoque de peças, coleta automática de telemetria.

## 5. Premissas, restrições e dependências

- Premissa: as horas de uso são apontadas por pessoas ou por um cliente HTTP; não há telemetria em tempo real.
- Premissa: a rede é interna/controlada, já que o draft define `authType: none`.
- Restrição: SQLite (definido no draft); Rails com ActiveRecord; porta 3001.
- Dependência: GitHub Actions para CI; Render como destino previsto de deploy (sem CD automatizado).
- Se a API for exposta à internet, a premissa de rede controlada deixa de valer e autenticação passa a ser obrigatória.

## 6. Atributos de qualidade

| Atributo | Prioridade | Cenário mensurável |
|---|---|---|
| Confiabilidade | Alta | Respostas HTTP consistentes: 201 em criação, 200 em leitura/atualização, 204 em exclusão, 422 e 404 em formato padronizado |
| Segurança de dados | Alta | Nenhuma resposta expõe stack trace; testado em `spec/requests/erros_spec.rb` |
| Manutenibilidade | Alta | Cobertura ≥ 70% (atual 99%); RuboCop sem ofensas; regra de status em um único serviço |
| Usabilidade | Média | Interface responsiva, navegável por teclado, prévia do status antes de salvar |
| Desempenho | Média | Listagens com pré-carregamento de manutenções (sem N+1) |
| Escalabilidade | Baixa | Frotas de centenas de máquinas; acima disso, migrar para PostgreSQL |

Trade-off: calcular status na leitura simplifica a consistência (não há dados derivados para sincronizar) ao custo de processar as máquinas a cada consulta de alertas.

## 7. Requisitos arquiteturalmente significativos

| ID | Descrição | Origem | Impacto | Critério verificável |
|---|---|---|---|---|
| ASR-01 | Somar horas ao total da máquina atomicamente | Regra de negócio | Transação + lock da máquina em `RegistroUso.registrar!` | Spec "não altera o total quando o registro é inválido" |
| ASR-02 | Só preventiva reinicia a contagem | Regra de negócio | Escopo `preventivas` no serviço de status | Specs de corretiva/preditiva |
| ASR-03 | Limites exatos 10% e 0 h | Regra de negócio | Comparações `<=` no serviço | Specs de fronteira em `status_manutencao_spec.rb` |
| ASR-04 | Sem vazamento de stack trace | Avaliação Architetto (ARC-004) | `rescue_from StandardError` + `exceptions_app` JSON | Spec de erro 500 |
| ASR-05 | Documentação de API não pública em produção | Avaliação Architetto (ARC-001) | Montagem condicional do rswag | Rota ausente com `RAILS_ENV=production` |

## 8. Princípios e padrões

- API-first: contrato OpenAPI gerado pelos próprios testes (rswag).
- Security-by-design: respostas de erro padronizadas, CORS restritivo, escape de HTML no JSON.
- Regras de negócio fora dos controllers (`app/services`).
- Respostas sem envelope `data`; números como número JSON; datas ISO 8601.
- Sem versionamento de rota (`/api/v1` não utilizado, conforme draft). Mudanças incompatíveis exigirão introduzir prefixo de versão.

## 9. Visão lógica

| Componente | Responsabilidade |
|---|---|
| `MaquinasController` | CRUD de máquinas |
| `RegistrosUsoController` | Listar e criar apontamentos de horas |
| `ManutencoesController` | Listar (com filtro `tipo`) e registrar manutenções |
| `AlertasController` | Filtrar e ordenar máquinas por status |
| `StatusManutencao` | Calcular horas desde a última preventiva, horas restantes, status e mensagem |
| Serializers | Converter modelos em JSON (decimais como número) |
| `ApplicationController` | Tratamento centralizado de erros |
| Web: páginas Painel, Máquinas, Apontar horas, Manutenções, Alertas | Fluxo do protótipo de demonstração gerado no Autom Hub |

Padrão: monólito em camadas (controllers → models/services → banco). Todas as dependências são síncronas.

## 10. Visão de dados

```
maquinas (1) ──< registros_uso (N)
         (1) ──< manutencoes   (N)
```

| Tabela | Campos principais | Restrições |
|---|---|---|
| maquinas | nome, codigo, fabricante, modelo, localizacao, data_aquisicao, intervalo_manutencao_horas, horas_uso_total | `codigo` único; intervalo > 0; horas ≥ 0 |
| registros_uso | maquina_id, horas, data, observacao | FK com `ON DELETE CASCADE`; horas > 0; data não futura |
| manutencoes | maquina_id, data, tipo, descricao, responsavel, horas_maquina, custo | tipo ∈ {preventiva, corretiva, preditiva}; custo ≥ 0 |

Valores decimais com precisão 12,2. Não há dados pessoais sensíveis além do nome do responsável. Backup: cópia do arquivo SQLite (`storage/production.sqlite3`) com o banco em modo WAL; recomenda-se cópia diária com retenção de 30 dias.

## 11. Integrações e APIs

REST/JSON, sem autenticação (draft). Catálogo completo no README e em `api/swagger/v1/swagger.yaml`. Coleção Postman em `api/postman/`. Operações de escrita não são idempotentes: o cliente não deve repetir `POST` de horas automaticamente após timeout sem verificar o histórico.

## 12. Segurança e privacidade

| Ameaça (OWASP API Top 10 2023) | Situação |
|---|---|
| API1/API5 – autorização quebrada | **Risco aceito no escopo atual** (`authType: none`). Recomendação: token por usuário e perfis técnico/supervisor antes de exposição pública |
| API8 – configuração insegura | Swagger só fora de produção; `force_ssl`; host authorization; CORS por lista |
| Vazamento de erros | Tratamento global, log com `request_id` |
| Injeção | ActiveRecord parametrizado; strong parameters; escape de HTML no JSON |
| API4 – consumo de recursos | Upload CSV limitado a 512 KB no cliente; recomenda-se rate limiting no proxy |

Controles de pipeline: Brakeman (SAST), bundler-audit (SCA), gitleaks (secret scan).

## 13. Infraestrutura e implantação

Desenvolvimento: API em `localhost:3001`, web em `localhost:5173`. Produção prevista: Render, um serviço web para a API com disco persistente para o SQLite e um site estático para o build do frontend. Configuração por variáveis de ambiente (ver README). Sem IaC no escopo.

## 14. CI/CD

Workflow `.github/workflows/ci.yml` em push para `main` e em pull requests:

1. `lint` – RuboCop
2. `seguranca` – Brakeman, bundler-audit, gitleaks
3. `testes` – migrations, specs unitárias, specs de integração, suíte completa com gate de cobertura de 70%
4. `frontend` – oxlint e build do Vite

Fluxo trunk-based. Sem CD automatizado; deploy manual no Render.

## 15. Observabilidade

Logs do Rails com `request_id` em produção; erros inesperados registrados em JSON (`evento`, `classe`, `mensagem`, `request_id`). Healthcheck em `/up`. Métricas e dashboards ficam para evolução futura.

## 16. Desempenho e capacidade

Volume esperado: dezenas a centenas de máquinas e alguns milhares de apontamentos por mês. Listagens usam `includes(:manutencoes)` para evitar N+1. Gatilho de evolução: mais de 1.000 máquinas ou escrita concorrente alta → migrar para PostgreSQL e materializar o status.

## 17. Disponibilidade e continuidade

Criticidade: média (apoio à decisão, não controla máquinas). SPOF: instância única e arquivo SQLite. RPO 24 h (backup diário), RTO 1 h (restaurar arquivo e reiniciar).

## 18. Qualidade e testes

| Tipo | Ferramenta | Cobertura |
|---|---|---|
| Unitários | RSpec + factory_bot | Modelos e serviço de status (limites de 10% e 0 h) |
| Integração | RSpec request specs + rswag | Todos os endpoints, 422, 404, 400, 500 |
| Contrato | rswag (gera OpenAPI) | Schemas de resposta |
| Smoke | Postman/Newman | Fluxo completo cadastro → horas → alerta → preventiva |
| Cobertura | SimpleCov | Mínimo 70% (atual 99%) |

## 19. Riscos e dívidas técnicas

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Acesso não autenticado se exposta | Média | Alto | Rede interna; autenticação no próximo ciclo |
| Ruby 3.4.9 com CVE crítica | Alta | Alto | Atualizar para 3.4.13+ |
| SQLite com concorrência de escrita | Baixa | Médio | Migrar para PostgreSQL ao crescer |
| Apontamento duplicado por reenvio | Média | Baixo | Histórico visível por máquina; idempotência futura |
