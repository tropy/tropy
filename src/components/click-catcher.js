'use strict'

const React = require('react')
const { PureComponent, createElement: create } = React
const PropTypes = require('prop-types')
const { arrayOf, oneOfType, bool, func, string } = PropTypes
const { DropTarget } = require('react-dnd')
const cx = require('classnames')


class ClickCatcher extends PureComponent {

  connect(handle) {
    return (this.props.isDisabled) ? handle : this.props.dt(handle)
  }

  render() {
    return this.connect(
      create(this.props.node, {
        className: cx({ 'click-catcher': true, 'over': this.props.isOver }),
        onClick: this.props.onClick
      })
    )
  }

  static propTypes = {
    accept: oneOfType([arrayOf(string), string]).isRequired,
    isDisabled: bool,
    isOver: bool,
    dt: func.isRequired,
    node: string,
    onClick: func.isRequired,
    onDrop: func
  }

  static defaultProps = {
    node: 'li'
  }
}

const types = ({ accept }) => accept

const spec = {
  drop({ onDrop }, monitor) {
    onDrop(monitor.getItem())
  }
}

const collect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  item: monitor.getItem(),
  isOver: monitor.isOver()
})

module.exports = {
  ClickCatcher: DropTarget(types, spec, collect)(ClickCatcher)
}
