'use strict'

const React = require('react')
const { PureComponent } = React
const { StaticField } = require('../metadata/field')
const { object } = require('prop-types')
const { datetime } = require('../../format')


class ItemInfo extends PureComponent {
  render() {
    return (
      <ol className="item-info metadata-fields">
        <StaticField
          label="item.created"
          value={datetime(this.props.item.created)}/>
        <StaticField
          label="item.modified"
          value={datetime(this.props.item.modified)}/>
      </ol>
    )
  }

  static propTypes = {
    item: object.isRequired
  }
}

module.exports = {
  ItemInfo
}
