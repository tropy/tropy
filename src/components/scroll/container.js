import React from 'react'
import cx from 'classnames'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'
import { on, off } from '../../dom.js'

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
      on(this.container.current, 'scroll', this.handleScroll)
  }

  componentWillUnmount() {
    this.#RO.unobserve(this.container.current)
    this.#RO.disconnect()

    off(this.container.current, 'scroll', this.handleScroll)
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
  }, 150)

  render() {
    return (
      <div
        ref={this.container}
        className={cx('scroll-container', this.props.className, {
          scrolling: this.state.isScrolling
        })}
        onBlur={this.props.onBlur}
        onClick={this.props.onClick && this.handleClick}
        onFocus={this.props.onFocus}
        onKeyDown={this.props.tabIndex && this.props.onKeyDown}
        tabIndex={this.props.tabIndex ?? -1}>
        {this.props.children}
      </div>
    )
  }
}
