import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'

// klein diag-venster rechtsonder
const diagEl = document.createElement('div')
diagEl.id = 'diag'
diagEl.style.cssText = 'position:fixed;bottom:8px;left:8px;font:12px monospace;color:#b91c1c;z-index:99999'
document.body.appendChild(diagEl)
const diag = (m: any) => { diagEl.textContent = String(m) }

// globale error hooks (zodat een witte pagina z'n fout toont)
window.onerror = (msg, src, line, col, err) => { diag(`JS error: ${msg}`) }
window.onunhandledrejection = (ev: any) => { diag(`Promise rejection: ${ev?.reason ?? ev}`) }

// ErrorBoundary toont render-fouten ipv wit scherm
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {err?: any}> {
  constructor(p:any){ super(p); this.state = {} }
  static getDerivedStateFromError(err:any){ return {err} }
  componentDidCatch(err:any){ diag('Render error: ' + String(err)) }
  render(){ return this.state.err
    ? <div style={{padding:24,fontFamily:'system-ui',color:'#b91c1c'}}>Fout: {String(this.state.err)}</div>
    : this.props.children }
}

// App lazy laden: als import mislukt, zie je dat in diag
const App = React.lazy(() => import('./App'))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <Suspense fallback={<div style={{padding:24,fontFamily:'system-ui'}}>Laden…</div>}>
      <App />
    </Suspense>
  </ErrorBoundary>
)
