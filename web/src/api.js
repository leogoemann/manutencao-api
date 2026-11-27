const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || 'Não foi possível concluir a operação.')
    this.status = status
    this.fieldErrors = body?.errors || null
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, { error: `A API não respondeu em ${BASE_URL}. Verifique se ela está rodando.` })
  }
  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const fallback = response.status === 422 ? 'Revise os campos destacados.' : undefined
    throw new ApiError(response.status, data?.error || data?.errors ? data : { error: fallback })
  }
  return data
}

export const api = {
  baseUrl: BASE_URL,
  listarMaquinas: () => request('/maquinas'),
  buscarMaquina: (id) => request(`/maquinas/${id}`),
  criarMaquina: (maquina) => request('/maquinas', { method: 'POST', body: { maquina } }),
  atualizarMaquina: (id, maquina) => request(`/maquinas/${id}`, { method: 'PUT', body: { maquina } }),
  excluirMaquina: (id) => request(`/maquinas/${id}`, { method: 'DELETE' }),
  listarRegistrosUso: (maquinaId) => request(`/maquinas/${maquinaId}/registros_uso`),
  registrarUso: (maquinaId, registro_uso) =>
    request(`/maquinas/${maquinaId}/registros_uso`, { method: 'POST', body: { registro_uso } }),
  listarManutencoes: (maquinaId) => request(`/maquinas/${maquinaId}/manutencoes`),
  registrarManutencao: (maquinaId, manutencao) =>
    request(`/maquinas/${maquinaId}/manutencoes`, { method: 'POST', body: { manutencao } }),
  listarAlertas: (status) => request(status ? `/alertas?status=${encodeURIComponent(status)}` : '/alertas'),
}
