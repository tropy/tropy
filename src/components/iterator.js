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
    this.container.current.scrollIntoView(item, { force })
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

  scroll(offset = 0) {
    this.container.current?.scroll(offset)
  }

  static getPropKeys() {
    return Object.keys(this.propTypes || this.DecoratedComponent.propTypes)
  }

  static propTypes = {
    isDisabled: bool,
    restrict: oneOf(['bounds', 'wrap', 'none']).isRequired,
    size: number
  }

  static defaultProps = {
    restrict: 'bounds'
  }
}
