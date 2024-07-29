export * from './header.js'
export * from './nav.js'

export function Prefs({ children, ...props }) {
  return (
    <div className="prefs" {...props}>
      {children}
    </div>
  )
}

export function Body({ children }) {
  return (
    <div className="prefs-body">
      {children}
    </div>
  )
}

export default Prefs
