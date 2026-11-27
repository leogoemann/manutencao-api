const COLUNAS = ['codigo', 'horas', 'data', 'observacao']

function dividir(linha, separador) {
  const campos = []
  let atual = ''
  let aspas = false
  for (let i = 0; i < linha.length; i += 1) {
    const c = linha[i]
    if (c === '"' && linha[i + 1] === '"' && aspas) {
      atual += '"'
      i += 1
    } else if (c === '"') {
      aspas = !aspas
    } else if (c === separador && !aspas) {
      campos.push(atual.trim())
      atual = ''
    } else {
      atual += c
    }
  }
  campos.push(atual.trim())
  return campos
}

function normalizarData(valor) {
  const br = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  return valor
}

export function lerApontamentos(texto) {
  const linhas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
  if (linhas.length === 0) return []
  const separador = linhas[0].includes(';') ? ';' : ','
  const cabecalho = dividir(linhas[0], separador).map((c) => c.toLowerCase())
  const temCabecalho = cabecalho.includes('codigo') && cabecalho.includes('horas')
  const ordem = temCabecalho ? cabecalho : COLUNAS
  return linhas.slice(temCabecalho ? 1 : 0).map((linha, indice) => {
    const campos = dividir(linha, separador)
    const item = Object.fromEntries(ordem.map((coluna, i) => [coluna, campos[i] ?? '']))
    return {
      linha: indice + (temCabecalho ? 2 : 1),
      codigo: item.codigo,
      horas: item.horas.replace(',', '.'),
      data: normalizarData(item.data),
      observacao: item.observacao || null,
    }
  })
}
