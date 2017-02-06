'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { DropTarget } = require('react-dnd')
const cn = require('classnames')

const { arrayOf, bool, func, string } = PropTypes

class ClickCatcher extends PureComponent {

  connect(handle) {
    return (this.props.isDisabled) ? handle : this.props.dt(handle)
  }

  render() {
    return this.connect(
      <li
        className={cn({ 'click-catcher': true, 'over': this.props.isOver })}
        onClick={this.props.onClick}/>
    )
  }

  static propTypes = {
    accept: arrayOf(string).isRequired,
    isDisabled: bool,
    isOver: bool,
    dt: func.isRequired,
    onClick: func.isRequired,
    onDrop: func.isRequired
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
