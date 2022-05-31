import React from 'react'
import { element, func, number, object, oneOfType, string } from 'prop-types'
import cx from 'classnames'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'
import { on, off } from '../../dom'

export class ScrollContainer extends React.Component {
  container = React.createRef()

  #didSync = false

  #RO = new ResizeObserver(([e]) => {
    this.handleResize(e.contentRect)
  })

  state = {
    isScrolling: false
  }

  componentDidMount() {
    if (this.props.onResize)
      this.#RO.observe(this.container.current)

    if (this.props.onScroll || this.props.sync)
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

    this.handleScrollStop.cancel()
  }

  get bounds() {
    let { clientWidth, clientHeight } = this.container.current

    return {
      width: clientWidth,
      height: clientHeight
    }
  }

  get isScrolling() {
    return this.state.isScrolling
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

  sync(y, x) {
    if (y != null && y !== this.container.current.scrollTop) {
      this.#didSync = true
      this.container.current.scrollTop = y
    }
    if (x != null && x !== this.container.current.scrollLeft) {
      this.#didSync = true
      this.container.current.scrollLeft = x
    }
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
    if (!this.state.isScrolling) {
      this.setState({ isScrolling: true })
      this.props.onScrollStart?.(event)
    }

    this.props.onScroll?.(event)

    if (this.props.sync?.current && !this.#didSync) {
      this.props.sync.current.sync(null, this.scrollLeft)
    }

    this.#didSync = false
    this.handleScrollStop()
  }

  handleScrollStop = debounce(() => {
    this.setState({ isScrolling: false })
    this.props.onScrollStop?.()
  }, 250)

  handleTabFocus = (event) => {
    this.props.onTabFocus(event)
  }

  render() {
    return (
      <div
        ref={this.container}
        className={cx('scroll-container', this.props.className, {
          scrolling: this.state.isScrolling
        })}
        onBlur={this.props.onBlur}
        onClick={this.props.onClick && this.handleClick}
        onKeyDown={this.props.tabIndex && this.props.onKeyDown}
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
    onScrollStart: func,
    onScrollStop: func,
    onTabFocus: func,
    sync: object,
    tabIndex: number
  }
}
