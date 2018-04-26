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
  handleMouseDown = (event) => {
    event.preventDefault()
    event.stopPropagation()
    this.props.onClick(this.props.option)
  }

  handleMouseMove = (event) => {
    this.props.onHover(event, this.props.isSelected, this.props.option)
  }

  render() {
    return (
      <li
        className={cx('option', { active: this.props.isSelected })}
        onMouseMove={this.handleMouseMove}
        onMouseDown={this.handleMouseDown}>
        {this.props.option.value}
      </li>
    )
  }

  static propTypes = {
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
  getIterables() {
    return this.props.values
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
    return this.props.selection
  }

  isSelected({ id }) {
    return id === this.props.selection && !blank(id)
  }

  handleFocus = false

  handleHover = (event, isSelected, option) => {
    if (this.hasMoved(event) && !isSelected) {
      this.props.onHover(option)
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
    selection: string,
    onHover: func.isRequired,
    onSelect: func.isRequired,
    rowHeight: number.isRequired,
    values: arrayOf(shape({
      id: string.isRequired,
      value: node.isRequired
    })).isRequired
  }

  static defaultProps = {
    ...Iterator.defaultProps,
    rowHeight: OPTION.HEIGHT
  }

  static getHeight(rows, { maxRows = rows, rowHeight = OPTION.HEIGHT } = {}) {
    return (rows) ? min(rows, maxRows) * rowHeight + OPTION.LIST_MARGIN : 0
  }
}

module.exports = {
  Option,
  OptionList
}
