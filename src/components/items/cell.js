'use strict'

const React = require('react')
const { PropTypes } = React
const classes = require('classnames')

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

const Cell = ({ icon, type, value, width }) => (
  <div className={classes(['metadata', type])} style={{ width }}>
    <CellIcon icon={icon}/>
    {value}
  </div>
)

Cell.propTypes = {
  icon: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  width: PropTypes.string
}

module.exports = {
  Cell,
  CellIcon
}
