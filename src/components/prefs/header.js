import { node } from 'prop-types'

export function Header({ children }) {
  return (
    <header className="prefs-header">
      {children}
    </header>
  )
}

Header.propTypes = {
  children: node
}
