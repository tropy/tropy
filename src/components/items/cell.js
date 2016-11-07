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

  changed = (value) => {
    this.props.onChange({
      [this.props.property.name]: { value, type: this.type }
    })
  }

  get value() {
    return this.props.value ? this.props.value.value : null
  }

  get type() {
    return this.props.value ?
      this.props.value.type : this.props.property.type
  }

  render() {
    const {
      active, width, icon, disabled, onCancel
    } = this.props

    return (
      <td
        className={cn({ metadata: true, [this.type]: true })}
        style={{ width }}>
        <CellIcon icon={icon}/>
        <Editable
          value={this.value}
          editing={active}
          disabled={disabled}
          onActivate={this.activate}
          onCancel={onCancel}
          onChange={this.changed}/>
      </td>
    )
  }

  static propTypes = {
    icon: PropTypes.string,
    disabled: PropTypes.bool,
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
