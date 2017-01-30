'use strict'

const React = require('react')
const { PropTypes } = React
const cn = require('classnames')
const { IconChevron7 } = require('../icons')


const ItemTableHead = ({ columns }) => (
  <table className="table-head">
    <thead>
      <tr>
        {columns.map(({ width, property, order }) => (
          <th
            key={property.uri}
            className={cn(['metadata-head', property.type, order])}
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

ItemTableHead.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object)
}

module.exports = {
  ItemTableHead
}
