'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { shape, string, bool, object, arrayOf, oneOf } = PropTypes
const cn = require('classnames')
const { IconChevron7 } = require('../icons')


class ItemTableHead extends PureComponent {

  order(uri) {
    if (uri !== this.props.sort.column) return null
    return this.props.sort.asc ? 'ascending' : 'descending'
  }

  render() {
    const { columns } = this.props

    return (
      <table className="table-head">
        <thead>
          <tr>
            {columns.map(({ width, property }) => (
              <th
                key={property.uri}
                className={cn([
                  'metadata-head', property.type, this.order(property.uri)
                ])}
                style={{ width }}>
                <div className={cn(['metadata-head-container'])}>
                  <div className="label">{property.label}</div>
                  <IconChevron7/>
                </div>
              </th>
            ))}
          </tr>
        </thead>
      </table>
    )
  }

  static propTypes = {
    columns: arrayOf(shape({
      property: object.isRequired,
      width: string.isRequired
    })).isRequired,

    sort: shape({
      asc: bool,
      column: string.isRequired,
      type: oneOf(['property']).isRequired
    }).isRequired
  }
}

module.exports = {
  ItemTableHead
}
