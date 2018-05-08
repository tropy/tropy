'use strict'

const React = require('react')
const { Component } = React
const { Select } = require('./select')
const { IconXSmall } = require('./icons')
const { Button } = require('./button')
const { array, func, string } = require('prop-types')

const autofocus = (component) => {
  if (component != null) component.focus()
}

class Column extends Component {
  handleRemove = () => {
    this.props.onRemove({ id: this.props.id })
  }

  render() {
    return (
      <div className="column">
        {this.props.label}
        <Button
          icon={<IconXSmall/>}
          onMouseDown={this.handleRemove}/>
      </div>
    )
  }

  static propTypes = {
    id: string.isRequired,
    label: string.isRequired,
    onRemove: func.isRequired
  }
}


class ColumnSelect extends Component {
  handleSelect = () => {
  }

  render() {
    return (
      <div className="column-select">
        <div className="current-columns">
          {this.props.columns.map(col =>
            <Column
              id={col.id}
              key={col.id}
              label={this.props.toText(col)}
              onRemove={this.props.onRemove}/>)}
        </div>
        <Select
          isStatic
          onChange={this.handleSelect}
          options={this.props.options}
          ref={autofocus}
          toText={this.props.toText}/>
      </div>
    )
  }

  static propTypes = {
    columns: array.isRequired,
    options: array.isRequired,
    onInsert: func.isRequired,
    onRemove: func.isRequired,
    toText: func.isRequired
  }

  static defaultProps = {
    toText: column => column.label || column.id
  }

}

module.exports = {
  ColumnSelect
}
