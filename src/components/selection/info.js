'use strict'

const React = require('react')
const { PureComponent } = React
const { StaticField } = require('../metadata/field')
const { object } = require('prop-types')
const { datetime, number } = require('../../format')


class SelectionInfo extends PureComponent {
  get size() {
    const { width, height } = this.props.selection
    return `${number(width)}×${number(height)}`
  }

  render() {
    return (
      <ol className="selection-info metadata-fields">
        <StaticField
          label="selection.size"
          value={this.size}/>
        <StaticField
          label="selection.created"
          value={datetime(this.props.selection.created)}/>
        <StaticField
          label="selection.modified"
          value={datetime(this.props.selection.modified)}/>
      </ol>
    )
  }

  static propTypes = {
    selection: object.isRequired
  }
}

module.exports = {
  SelectionInfo
}
