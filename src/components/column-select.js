'use strict'

const React = require('react')
const { Component } = React
const { ResourceSelect } = require('./resource/select')
const { IconXSmall } = require('./icons')
const { Button } = require('./button')
const { array, func, node, string } = require('prop-types')

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
    label: node.isRequired,
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
              label={ResourceSelect.defaultProps.toText(col)}
              onRemove={this.props.onRemove}/>)}
        </div>
        <ResourceSelect
          isStatic
          onChange={this.handleSelect}
          options={this.props.options}
          ref={autofocus}/>
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
