import React from 'react'
import { element, func, number, object, oneOfType, string } from 'prop-types'
import cx from 'classnames'
import throttle from 'lodash.throttle'
import { on, off } from '../../dom'

export class ScrollContainer extends React.Component {
  container = React.createRef()

  #RO = new ResizeObserver(([e]) => {
    this.handleResize(e.contentRect)
  })

  componentDidMount() {
    if (this.props.onResize)
      this.#RO.observe(this.container.current)

    if (this.props.onScroll)
      on(this.container.current, 'scroll', this.handleScroll, {
        capture: true, passive: true
      })

    if (this.props.onTabFocus)
      on(this.container.current, 'tab:focus', this.handleTabFocus)
  }

  componentWillUnmount() {
    this.#RO.unobserve(this.container.current)
    this.#RO.disconnect()

    off(this.container.current, 'scroll', this.handleScroll, {
      capture: true, passive: true
    })

    off(this.container.current, 'tab:focus', this.handleTabFocus)
  }

  get bounds() {
    let { clientWidth, clientHeight } = this.container.current

    return {
      width: clientWidth,
      height: clientHeight
    }
  }

  get scrollTop() {
    return this.container.current.scrollTop
  }

  get scrollLeft() {
    return this.container.current.scrollLeft
  }

  focus() {
    this.container.current.focus()
  }

  scroll(y, x) {
    if (y != null)
      this.container.current.scrollTop = y
    if (x != null)
      this.container.current.scrollLeft = x
  }

  scrollBy(y, x) {
    this.scroll(
      y != null ? this.scrollTop + y : null,
      x != null ? this.scrollLeft + x : null
    )
  }

  handleClick = (event) => {
    if (event.target === this.container.current)
      this.props.onClick()
  }

  handleResize = throttle((rect) => {
    this.props.onResize(rect)
  }, 15)

  handleScroll = (event) => {
    this.props.onScroll(event)
  }

  handleTabFocus = (event) => {
    this.props.onTabFocus(event)
  }

  render() {
    return (
      <div
        ref={this.container}
        className={cx('scroll-container', this.props.className)}
        onBlur={this.props.onBlur}
        onClick={this.props.onClick && this.handleClick}
        onKeyDown={this.props.onKeyDown}
        tabIndex={this.props.tabIndex}>
        {this.props.children}
      </div>
    )
  }

  static propTypes = {
    children: element,
    className: oneOfType(object, string),
    onBlur: func,
    onClick: func,
    onKeyDown: func,
    onResize: func,
    onScroll: func,
    onTabFocus: func,
    tabIndex: number
  }
}
