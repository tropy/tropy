'use strict'

const React = require('react')
const { PropTypes } = React
const { FormattedMessage } = require('react-intl')
const classes = require('classnames')


const ListHead = ({ columns }) => (
  <table className="list-head">
    <thead>
      <tr>
        {columns.map(({ width, property, order }, idx) => (
          <th key={idx}
            className={classes(['metadata-head', property.type, order])}
            style={{ width }}>
            <FormattedMessage id={`fields.${property.name}`}/>
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
