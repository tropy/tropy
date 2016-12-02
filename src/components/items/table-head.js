'use strict'

const React = require('react')
const { PropTypes } = React
const cn = require('classnames')


const TableHead = ({ columns }) => (
  <table className="table-head">
    <thead>
      <tr>
        {columns.map(({ width, property, order }) => (
          <th
            key={property.uri}
            className={cn(['metadata-head', property.type, order])}
            style={{ width }}>
            {property.label}
          </th>
        ))}
      </tr>
    </thead>
  </table>
)

TableHead.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object)
}

module.exports = {
  TableHead
}
