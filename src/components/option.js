'use strict'

const React = require('react')
const { Iterator } = require('./iterator')
const { array, string } = require('prop-types')
const { OPTION } = require('../constants/sass')
const { min } = Math


const Option = ({ value }) => (
  <li className="option">{value}</li>
)

Option.propTypes = {
  value: string.isRequired
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
                <Option key={id} value={name}/>)}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  static propTypes = {
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
