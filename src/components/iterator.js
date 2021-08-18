import React from 'react'
import { TABS } from '../constants'
import { bool, number, oneOf } from 'prop-types'


export class Iterator extends React.PureComponent {
  container = React.createRef()

  state = {}

  get isDisabled() {
    return this.props.isDisabled
  }

  get size() {
    return this.getIterables().length
  }

  get tabIndex() {
    return this.size === 0 ? null : TABS[this.constructor.name]
  }

  indexOf(id, props = this.props) {
    const items = this.getIterables(props)
    return (items.idx != null) ?
      items.idx[id] :
      items.findIndex(it => it.id === id)
  }

  scrollIntoView(item = this.current(), force = true) {
    if (item == null || this.container.current == null) return
    const idx = this.indexOf(item.id)
    if (idx === -1) return
    this.container.current.scrollIntoView(idx, { force })
  }

  handleClickOutside = () => {
    if (typeof this.clearSelection === 'function')
      this.clearSelection()
  }


  // TODO Use Scroll component directly

  next(offset = 1) {
    const items = this.getIterables()
    return items[this.container.current?.next(offset)]
  }

  prev(offset = 1) {
    return this.next(-offset)
  }

  current() {
    return this.next(0)
  }

  first() {
    return this.getIterables()[0]
  }

  last() {
    const items = this.getIterables()
    return items[items.length - 1]
  }

  pageDown() {
    const items = this.getIterables()
    return items[this.container.current?.pageDown()]
  }

  pageUp() {
    const items = this.getIterables()
    return items[this.container.current?.pageUp()]
  }

  scroll(offset = 0) {
    this.container.current?.scroll(offset)
  }

  scrollBy(offset) {
    this.container.current?.scrollBy(offset)
  }


  static getPropKeys() {
    return Object.keys(this.propTypes || this.DecoratedComponent.propTypes)
  }

  static propTypes = {
    isDisabled: bool,
    overscan: number.isRequired,
    restrict: oneOf(['bounds', 'wrap', 'none']).isRequired,
    size: number
  }

  static defaultProps = {
    overscan: 1.25,
    restrict: 'bounds'
  }
}
