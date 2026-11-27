import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ToastContext } from './toast.js'
import { STATUS } from '../format.js'

export function StatusBadge({ status }) {
  const info = STATUS[status] || STATUS.em_dia
  return (
    <span className={`status status-${info.classe}`}>{info.rotulo}</span>
  )
}

export function Field({ label, error, hint, children, id }) {
  const gerado = useId()
  const campoId = id || gerado
  const descricaoId = `${campoId}-descricao`
  const filho = typeof children === 'function'
    ? children({ id: campoId, 'aria-invalid': error ? true : undefined, 'aria-describedby': error || hint ? descricaoId : undefined })
    : children
  return (
    <div className={`field${error ? ' field-error' : ''}`}>
      <label htmlFor={campoId}>{label}</label>
      {filho}
      {(error || hint) && (
        <p className="field-hint" id={descricaoId}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return <button type="button" className={`btn btn-${variant} ${className}`} {...props} />
}

export function Drawer({ aberto, titulo, descricao, onFechar, children }) {
  const painelRef = useRef(null)
  const tituloId = useId()

  useEffect(() => {
    if (!aberto) return undefined
    const anterior = document.activeElement
    const foco = painelRef.current?.querySelector('input, select, textarea, button')
    foco?.focus()
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    document.body.classList.add('sem-rolagem')
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.classList.remove('sem-rolagem')
      anterior?.focus?.()
    }
  }, [aberto, onFechar])

  if (!aberto) return null
  return (
    <div className="drawer-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby={tituloId} ref={painelRef}>
        <header className="drawer-topo">
          <div>
            <h2 id={tituloId}>{titulo}</h2>
            {descricao && <p className="muted">{descricao}</p>}
          </div>
          <button type="button" className="icone-btn" onClick={onFechar} aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </header>
        <div className="drawer-corpo">{children}</div>
      </aside>
    </div>
  )
}

export function Confirmacao({ aberto, titulo, texto, acao, onConfirmar, onCancelar, ocupado }) {
  return (
    <Drawer aberto={aberto} titulo={titulo} onFechar={onCancelar}>
      <p className="confirmacao-texto">{texto}</p>
      <div className="form-acoes">
        <Button variant="ghost" onClick={onCancelar}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirmar} disabled={ocupado}>{ocupado ? 'Excluindo…' : acao}</Button>
      </div>
    </Drawer>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const avisar = useCallback((texto, tipo = 'sucesso') => {
    const id = crypto.randomUUID()
    setToasts((atuais) => [...atuais, { id, texto, tipo }])
    setTimeout(() => setToasts((atuais) => atuais.filter((t) => t.id !== id)), 4200)
  }, [])
  return (
    <ToastContext.Provider value={avisar}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`}>{t.texto}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function Vazio({ titulo, texto, children }) {
  return (
    <div className="vazio">
      <h3>{titulo}</h3>
      {texto && <p className="muted">{texto}</p>}
      {children}
    </div>
  )
}

export function ErroCarregamento({ erro, onTentar }) {
  return (
    <div className="erro-bloco" role="alert">
      <p>{erro}</p>
      {onTentar && <Button variant="ghost" onClick={onTentar}>Tentar novamente</Button>}
    </div>
  )
}

export function Carregando({ texto = 'Carregando…' }) {
  return <p className="carregando" aria-busy="true">{texto}</p>
}
