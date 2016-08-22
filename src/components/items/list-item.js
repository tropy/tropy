'use strict'

const React = require('react')
const { PropTypes } = React
const classes = require('classnames')
const { Cell } = require('./cell')

const ListItem = ({ data, active, columns }) => (
  <li className={classes({ item: true, active })}>
    {columns.map(({ field, width }, idx) => (
      <Cell key={idx}
        type={field.type}
        value={data[field.name].value}
        icon={idx ? null : data.image}
        width={width}/>
    ))}
  </li>
)

ListItem.propTypes = {
  active: PropTypes.bool,
  data: PropTypes.object,
  columns: PropTypes.arrayOf(PropTypes.object)
}

ListItem.defaultProps = {
  active: false
}


module.exports = {
  ListItem
}
