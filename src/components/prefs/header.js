import { node, string } from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { Titlebar } from '../toolbar.js'

export function Header({ children, title }) {
  return (
    <header className="prefs-header">
      <Titlebar isOptional>
        <FormattedMessage id={title}/>
      </Titlebar>
      {children}
    </header>
  )
}

Header.propTypes = {
  children: node,
  title: string.isRequired
}

Header.defaultProps = {
  title: 'prefs.title'
}
