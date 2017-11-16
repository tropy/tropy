'use strict'

const React = require('react')
const { Component } = React
const { Iterator } = require('./iterator')
const { array, func, string } = require('prop-types')
const { OPTION } = require('../constants/sass')
const { min } = Math


class Option extends Component {
  handleMouseDown = (event) => {
    event.preventDefault()
    event.stopPropagation()
    this.props.onClick(this.props.value)
  }

  render() {
    return (
      <li
        className="option"
        onMouseDown={this.handleMouseDown}>
        {this.props.value}
      </li>
    )
  }

  static propTypes = {
    onClick: func.isRequired,
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

  handleFocus = false

  render() {
    const { height } = this.state
    const { transform } = this

    return (
      <div className="option-list">
        <div className="scroll-container" ref={this.setContainer}>
          <div className="runway" style={{ height }}>
            <ul className="viewport" style={{ transform }}>
              {this.mapIterableRange(({ id, name }) =>
                <Option
                  key={id}
                  onClick={this.props.onSelect}
                  value={name}/>)}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  static propTypes = {
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
