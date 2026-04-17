import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import cx from 'classnames'
import { update } from '../../slices/prefs.js'
import { Icon } from '../icons.js'


export function Nav ({ children }) {
  return (
    <nav className="prefs-nav" tabindex={0}>
      <ul>
        {children}
      </ul>
    </nav>
  )
}

export function NavItem ({ name, icon, isDisabled }) {
  let dispatch = useDispatch()
  let pane = useSelector(state => state.prefs.pane)

  let handleChange = useCallback(() => {
    dispatch(update({ pane: name }))
  }, [name, dispatch])

  return (
    <li>
      <div
        className={cx('pane-toggle', name, {
          active: pane === name
        })}
        name={name}
        disabled={isDisabled}
        onClick={handleChange}>
        <Icon name={icon}/>
        <div className="truncate">
          <FormattedMessage id={`prefs.${name}.label`}/>
        </div>
      </div>
    </li>
  )
}
