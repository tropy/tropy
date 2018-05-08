'use strict'

const React = require('react')
const { Component } = React
const { Select } = require('./select')
const { array, func, string } = require('prop-types')

const autofocus = (component) => {
  if (component != null) component.focus()
}

const Column = ({ label, id }) => (
  <div className="column">{label || id}</div>
)

Column.propTypes = {
  id: string.isRequired,
  label: string
}

class ColumnSelect extends Component {
  handleColumnSelect = () => {
  }

  render() {
    return (
      <div className="column-select">
        <div className="current">
          {this.props.columns.map(column =>
            <Column key={column.id} {...column}/>)}
        </div>
        <Select
          isStatic
          onChange={this.handleColumnSelect}
          options={this.props.options}
          ref={autofocus}
          toText={Column}/>
      </div>
    )
  }

  static propTypes = {
    columns: array.isRequired,
    options: array.isRequired,
    onInsert: func.isRequired,
    onRemove: func.isRequired
  }
}

module.exports = {
  ColumnSelect
}
