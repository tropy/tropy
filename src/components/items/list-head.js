'use strict'

const React = require('react')
const { PropTypes } = React
const { FormattedMessage } = require('react-intl')
const classes = require('classnames')


const ListHead = ({ columns }) => (
  <ul className="item-list item-list-head">
    <li className="item-head">
      {columns.map(({ width, field, order }, idx) => (
        <div key={idx}
          className={classes(['metadata-head', field.type, order])}
          style={{ width }}>
          <FormattedMessage id={`fields.${field.name}`}/>
        </div>
      ))}
    </li>
  </ul>
)

ListHead.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object)
}

module.exports = {
  ListHead
}
