import React from 'react'
import { FormattedMessage } from 'react-intl'
import cx from 'classnames'
import { bool, node, func, object, string } from 'prop-types'
import * as icons from '../icons.js'
import { linux } from '../../common/os.js'
import { useWindow } from '../../hooks/use-window.js'

export const PrefPaneToggle = React.memo(({
  name,
  icon,
  isActive,
  isDisabled,
  onClick
}) => {
  let win = useWindow()

  let Icon = icons[
    (linux && win.args.frameless) ? `${icon}Linux` : icon
  ]

  return (
    <button
      className={cx('pane-toggle', 'btn', name, { active: isActive })}
      disabled={isDisabled}
      tabIndex={-1}
      onClick={() => onClick({ pane: name })}>
      <Icon/>
      <FormattedMessage id={`prefs.${name}.label`}/>
    </button>
  )
})

PrefPaneToggle.propTypes = {
  icon: string.isRequired,
  isActive: bool,
  isDisabled: bool,
  name: string.isRequired,
  onClick: func.isRequired
}

PrefPaneToggle.defaultProps = {
  icon: 'IconTemplate'
}

export const PrefPane = (props) => (
  <div className={cx('pane', props.name, { active: props.isActive })}>
    {props.isActive && props.children}
  </div>
)

PrefPane.propTypes = {
  children: node,
  classes: object,
  isActive: bool,
  name: string.isRequired
}
