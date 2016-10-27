'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { Editable } = require('../editable')
const cn = require('classnames')


class Cell extends Component {
  constructor(props) {
    super(props)
  }

  activate = () => {
    this.props.onActivate(this.props.property.name)
  }

  render() {
    const {
      active, property, width, icon, value, onCancel, onChange
    } = this.props

    return (
      <td
        className={cn(['metadata', property.type])}
        style={{ width }}>
        <CellIcon icon={icon}/>
        <Editable
          value={value ? value.value : value}
          editing={active}
          onActivate={this.activate}
          onCancel={onCancel}
          onChange={onChange}/>
      </td>
    )
  }

  static propTypes = {
    icon: PropTypes.string,
    property: PropTypes.shape({
      name: PropTypes.string,
      type: PropTypes.string,
    }),
    value: PropTypes.object,
    width: PropTypes.string,
    active: PropTypes.bool,
    onActivate: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func
  }
}

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


module.exports = {
  Cell,
  CellIcon
}
