'use strict'

const React = require('react')
const { Component } = React
const { Iterator } = require('./iterator')
const { OPTION } = require('../constants/sass')
const { min } = Math
const cx = require('classnames')
const { array, bool, func, number, oneOfType, string } = require('prop-types')


class Option extends Component {
  handleMouseDown = (event) => {
    event.preventDefault()
    event.stopPropagation()
    this.props.onClick(this.props.id, this.props.value)
  }

  handleMouseMove = (event) => {
    this.props.onHover(
      event, this.props.isSelected, this.props.id, this.props.value
    )
  }

  render() {
    return (
      <li
        className={cx('option', { active: this.props.isSelected })}
        onMouseMove={this.handleMouseMove}
        onMouseDown={this.handleMouseDown}>
        {this.props.value}
      </li>
    )
  }

  static propTypes = {
    id: oneOfType([number, string]).isRequired,
    isSelected: bool,
    onClick: func.isRequired,
    onHover: func.isRequired,
    value: string.isRequired
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
    return OPTION.HEIGHT
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


  isSelected(option) {
    return this.props.selection != null && this.props.selection === option.id
  }

  handleFocus = false

  handleHover = (event, isSelected, ...args) => {
    if (this.hasMoved(event) && !isSelected) {
      this.props.onHover(...args)
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
                  id={option.id}
                  isSelected={this.isSelected(option)}
                  onClick={this.props.onSelect}
                  onHover={this.handleHover}
                  value={option.value}/>)}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  static propTypes = {
    selection: oneOfType([number, string]),
    onHover: func.isRequired,
    onSelect: func.isRequired,
    values: array.isRequired
  }

  static getHeight(rows, maxRows = rows) {
    return (rows) ? min(rows, maxRows) * OPTION.HEIGHT + OPTION.LIST_MARGIN : 0
  }
}

module.exports = {
  Option,
  OptionList
}
