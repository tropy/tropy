import { node } from 'prop-types'

export * from './header.js'
export * from './nav.js'

export function Prefs({ children, ...props }) {
  return (
    <div className="prefs" {...props}>
      {children}
    </div>
  )
}

Prefs.propTypes = {
  children: node
}

export function Body({ children }) {
  return (
    <div className="prefs-body">
      {children}
    </div>
  )
}

Body.propTypes = {
  children: node
}

export default Prefs
