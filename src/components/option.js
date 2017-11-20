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
    this.props.onClick(this.props.id)
  }

  render() {
    return (
      <li
        className={cx('option', { active: this.props.isSelected })}
        onMouseDown={this.handleMouseDown}>
        {this.props.value}
      </li>
    )
  }

  static propTypes = {
    id: oneOfType([number, string]).isRequired,
    isSelected: bool,
    onClick: func.isRequired,
    value: string.isRequired
  }
}


class OptionList extends Iterator {
  head() {
    return this.props.selection
  }

  getIterables() {
    return this.props.values
  }

  getColumns() {
    return 1
  }

  getRowHeight() {
    return OPTION.HEIGHT
  }

  isSelected(option) {
    return this.props.selection != null && this.props.selection === option.id
  }

  handleFocus = false

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
                  value={option.value}/>)}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  static propTypes = {
    selection: oneOfType([number, string]),
    onSelect: func.isRequired,
    values: array.isRequired
  }

  static getHeight(rows, minRows = 3) {
    return (rows) ? min(rows, minRows) * OPTION.HEIGHT + OPTION.LIST_MARGIN : 0
  }
}

module.exports = {
  Option,
  OptionList
}
