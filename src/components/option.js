'use strict'

const React = require('react')
const { Iterator } = require('./iterator')
const { array, number, string } = require('prop-types')

const Option = ({ value }) => (
  <li className="option">{value}</li>
)

Option.propTypes = {
  value: string.isRequired
}

class OptionList extends Iterator {
  get height() {
    return this.props.height
  }

  getIterables() {
    return this.props.values
  }

  getColumns() {
    return 1
  }

  getRowHeight() {
    return this.props.rowHeight
  }

  handleFocus = false
  handleResize = false

  render() {
    const { offset, height } = this.state
    const transform = `translate3d(0,${offset}px,0)`

    return (
      <div className="option-list" style={{ height: this.height }}>
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
    height: number.isRequired,
    rowHeight: number.isRequired,
    values: array.isRequired
  }
}

module.exports = {
  Option,
  OptionList
}
