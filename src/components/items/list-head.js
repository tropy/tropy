'use strict'

const React = require('react')
const { PropTypes } = React
const cn = require('classnames')


const ListHead = ({ columns }) => (
  <table className="list-head">
    <thead>
      <tr>
        {columns.map(({ width, property, order }, idx) => (
          <th key={idx}
            className={cn(['metadata-head', property.type || 'text', order])}
            style={{ width }}>
            {property.label}
          </th>
        ))}
      </tr>
    </thead>
  </table>
)

ListHead.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object)
}

module.exports = {
  ListHead
}
