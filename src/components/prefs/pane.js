import React, { Children } from 'react'
import { useSelector } from 'react-redux'
import { node, string } from 'prop-types'
import cx from 'classnames'
import { ScrollContainer } from '../scroll/container.js'

export const Pane = ({ children, name }) => {
  let pane = useSelector(state => state.prefs.pane)

  if (pane !== name)
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

Pane.propTypes = {
  children: node,
  name: string.isRequired
}

export const Footer = ({ children }) => (
  <footer>
    {children}
  </footer>
)

Footer.propTypes = {
  children: node
}
