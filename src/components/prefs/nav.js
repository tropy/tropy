import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { bool, node, string } from 'prop-types'
import cx from 'classnames'
import { update } from '../../slices/prefs.js'
import { Icon } from '../icons.js'


export function Nav({ children }) {
  return (
    <nav className="prefs-nav">
      <ul>
        {children}
      </ul>
    </nav>
  )
}

Nav.propTypes = {
  children: node
}


export function NavItem({ name, icon, isDisabled }) {
  let dispatch = useDispatch()
  let pane = useSelector(state => state.prefs.pane)

  let handleChange = useCallback(() => {
    dispatch(update({ pane: name }))
  }, [name, dispatch])

  return (
    <li>
      <button
        className={cx('pane-toggle', 'btn', name, {
          active: pane === name
        })}
        name={name}
        disabled={isDisabled}
        onClick={handleChange}
        tabIndex={-1}>
        <Icon name={icon}/>
        <div className="truncate">
          <FormattedMessage id={`prefs.${name}.label`}/>
        </div>
      </button>
    </li>
  )
}

NavItem.propTypes = {
  icon: string.isRequired,
  isDisabled: bool,
  name: string.isRequired
}
