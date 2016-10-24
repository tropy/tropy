'use strict'

const React = require('react')
const { PropTypes } = React
const { Editable } = require('../editable')
const cn = require('classnames')

const CellIcon = ({ icon, width, height }) => {
  return (icon) ? (
    <img
      src={`${icon}-${width}.jpg`}
      srcSet={`${icon}-${width}-2x.jpg 2x`}
      width={width} height={height}/>
  ) : null
}

CellIcon.propTypes = {
  icon: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number
}

CellIcon.defaultProps = {
  width: 24, height: 24
}

const noop = () => {}

const Cell = ({ icon, type, value, width }) => (
  <td className={cn(['metadata', type])} style={{ width }}>
    <CellIcon icon={icon}/>
    <Editable value={value ? value.value : value} onChange={noop}/>
  </td>
)

Cell.propTypes = {
  icon: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.object,
  width: PropTypes.string,
}

module.exports = {
  Cell,
  CellIcon
}
