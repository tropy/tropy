'use strict'

const React = require('react')
const { PureComponent } = React
const { Iterator } = require('./iterator')
const { OPTION } = require('../constants/sass')
const { min } = Math
const { blank } = require('../common/util')
const cx = require('classnames')
const {
  arrayOf, bool, func, node, number, shape, string
} = require('prop-types')


class Option extends PureComponent {
  get classes() {
    return ['option', {
      active: this.props.isActive,
      selected: this.props.isSelected
    }]
  }

  handleMouseDown = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.button === 0) {
      this.props.onClick(this.props.option)
    }
  }

  handleMouseMove = (event) => {
    this.props.onHover(event, this.props.isActive, this.props.option)
  }

  render() {
    return (
      <li
        className={cx(this.classes)}
        onMouseMove={this.handleMouseMove}
        onMouseDown={this.handleMouseDown}>
        {this.props.option.value}
      </li>
    )
  }

  static propTypes = {
    isActive: bool,
    isSelected: bool,
    onClick: func.isRequired,
    onHover: func.isRequired,
    option: shape({
      id: string.isRequired,
      value: node.isRequired
    }).isRequired
  }
}


class OptionList extends Iterator {
  getIterables(props = this.props) {
    return props.values
  }

  getColumns() {
    return 1
  }

  getRowHeight() {
    return this.props.rowHeight
  }

  hasMoved({ clientX, clientY }) {
    try {
      return (clientX !== this.lastX || clientY !== this.lastY)
    } finally {
      this.lastX = clientX
      this.lastY = clientY
    }
  }

  head() {
    return this.props.active
  }

  isActive({ id }) {
    return id === this.props.active && !blank(id)
  }

  isSelected({ id }) {
    return this.props.selection.includes(id)
  }

  handleFocus = false

  handleHover = (event, isActive, option) => {
    if (this.hasMoved(event) && !isActive) {
      this.props.onActivate(option)
    }
  }

  render() {
    const { height } = this.state
    const { transform } = this

    return (
      <div className="option-list">
        <div className="scroll-container" ref={this.setContainer}>
          <div className="runway" style={{ height }}>
            <ul className="viewport" style={{ transform }}>
              {this.mapIterableRange(option =>
                <Option
                  key={option.id}
                  isActive={this.isActive(option)}
                  isSelected={this.isSelected(option)}
                  onClick={this.props.onSelect}
                  onHover={this.handleHover}
                  option={option}/>)}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  static propTypes = {
    active: string,
    onActivate: func.isRequired,
    onSelect: func.isRequired,
    rowHeight: number.isRequired,
    selection: arrayOf(string).isRequired,
    values: arrayOf(shape({
      id: string.isRequired,
      value: node.isRequired
    })).isRequired
  }

  static defaultProps = {
    ...Iterator.defaultProps,
    rowHeight: OPTION.HEIGHT,
    selection: []
  }

  static getHeight(rows, { maxRows = rows, rowHeight = OPTION.HEIGHT } = {}) {
    return (rows) ? min(rows, maxRows) * rowHeight + OPTION.LIST_MARGIN : 0
  }
}

module.exports = {
  Option,
  OptionList
}
