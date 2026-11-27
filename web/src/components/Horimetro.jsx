import { numero } from '../format.js'
import { LIMITE_PROXIMA } from '../regras.js'

export default function Horimetro({ horasDesde, intervalo, status, grande = false, previsto }) {
  const desde = Math.max(Number(horasDesde) || 0, 0)
  const total = Number(intervalo) || 1
  const escala = Math.max(total * 1.2, desde * 1.02, (previsto?.horasDesde ?? 0) * 1.02)
  const pct = (valor) => `${Math.min((valor / escala) * 100, 100)}%`
  const passo = total / 10
  const marcas = []
  for (let i = 0; i * passo <= escala; i += 1) marcas.push(i)
  const limiteProxima = total * (1 - LIMITE_PROXIMA)
  const rotulo = `${numero(desde)} de ${numero(total)} horas desde a última preventiva`

  return (
    <div className={`regua${grande ? ' regua-grande' : ''} regua-${status}`}>
      <div className="regua-escala" role="img" aria-label={rotulo}>
        <span className="regua-faixa-alerta" style={{ left: pct(limiteProxima), width: `calc(${pct(total)} - ${pct(limiteProxima)})` }} />
        {marcas.map((i) => (
          <span
            key={i}
            className={`regua-marca${i === 10 ? ' regua-marca-limite' : i % 5 === 0 ? ' regua-marca-media' : ''}`}
            style={{ left: pct(i * passo) }}
          />
        ))}
        {previsto && previsto.horasDesde > desde && (
          <span className="regua-previsto" style={{ left: pct(desde), width: `calc(${pct(previsto.horasDesde)} - ${pct(desde)})` }} />
        )}
        <span className="regua-ponteiro" style={{ width: pct(desde) }} />
      </div>
      {grande ? (
        <div className="regua-rotulos tabular" aria-hidden="true">
          <span style={{ left: 0 }}>0</span>
          <span style={{ left: pct(total / 2) }}>{numero(total / 2)}</span>
          <span style={{ left: pct(total) }}>{numero(total)} h</span>
        </div>
      ) : (
        <div className="regua-legenda tabular">
          <span>{numero(desde)} h</span>
          <span className="muted">de {numero(total)}</span>
        </div>
      )}
    </div>
  )
}
