import React, { Children } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { ScrollContainer } from '../scroll/container.js'

export const Pane = ({ isDisabled, children, name }) => {
  let pane = useSelector(state => state.prefs.pane)

  if (isDisabled || pane !== name)
    return null

  let [content, footer] = Children.toArray(children)

  return (
    <div className={cx('pane', name)}>
      <ScrollContainer>
        {content}
      </ScrollContainer>
      {footer}
    </div>
  )
}

export const Footer = ({ children }) => (
  <footer>
    {children}
  </footer>
)
