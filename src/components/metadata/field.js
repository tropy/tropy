'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { Editable } = require('../editable')
const { noop } = require('../../common/util')
const cn = require('classnames')


class Field extends Component {
  constructor(props) {
    super(props)
  }

  get label() {
    return this.props.property.name
  }

  get value() {
    return this.props.data[this.props.property.name]
  }

  get type() {
    return this.value ? this.value.type : this.props.property.type
  }

  activate = () => {
  }

  changed = () => {
  }

  render() {
    const { onCancel } = this.props
    const { value, type, label, activate, changed } = this

    return (
      <li className={cn({ 'metadata-field': true, [type]: true })}>
        <label>{label}</label>
        <Editable
          value={value ? value.value : null}
          editing={false}
          onActivate={activate}
          onCancel={onCancel}
          onChange={changed}/>
      </li>
    )
  }

  static propTypes = {
    property: PropTypes.shape({
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }),

    data: PropTypes.object.isRequired,

    onActivate: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func
  }

  static defaultProps = {
    onActivate: noop, onCancel: noop, onChange: noop
  }
}

module.exports = {
  Field
}
