'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { noop } = require('../common/util')
const cn = require('classnames')

class Editable extends Component {

  constructor(props) {
    super(props)

    this.state = {
      value: props.value || ''
    }
  }

  get valid() {
    return !(this.props.isRequired && !this.state.value)
  }

  get changed() {
    return this.state.value !== (this.props.value || '') && this.valid
  }

  update = (event) => {
    this.setState({ value: event.target.value })
  }

  stop = () => {
    const { onEditableCancel, onEditableChange } = this.props

    if (this.changed) {
      onEditableChange(this.state.value)
    } else {
      onEditableCancel()
    }
  }

  cancel() {
    const { value, onEditableCancel } = this.props

    this.setState({ value: value || '' })
    onEditableCancel()
  }

  handleKeyUp = (event) => {
    switch (event.which) {
      case 27:
        event.stopPropagation()
        this.cancel()
        break
      case 13:
        event.stopPropagation()
        this.stop()
        break
    }
  }

  focus(input) {
    if (input) {
      input.focus()
      input.select()
    }
  }


  componentWillReceiveProps({ value }) {
    this.setState({ value: value || '' })
  }

  render() {
    const {
      value, type, isEditing, isDisabled, isRequired, ...props
    } = this.props

    delete props.onEditableChange
    delete props.onEditableCancel

    if (isEditing) {
      return (
        <input {...props}
          className="editable editable-control"
          type={type}
          value={this.state.value}
          disabled={isDisabled}
          required={isRequired}
          ref={this.focus}
          onChange={this.update}
          onKeyUp={this.handleKeyUp}
          onBlur={this.stop}/>
      )
    }

    return (
      <span {...props} className={cn({
        editable: true,
        empty: !value,
        disabled: isDisabled
      })}>
        {value}
      </span>
    )
  }


  static propTypes = {
    isEditing: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isRequired: PropTypes.bool,

    value: PropTypes.string,
    type: PropTypes.oneOf(['text', 'number']),

    onMouseDown: PropTypes.func,
    onMouseUp: PropTypes.func,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,

    onEditableChange: PropTypes.func,
    onEditableCancel: PropTypes.func
  }

  static defaultProps = {
    type: 'text',
    onEditableCancel: noop,
    onEditableChange: noop
  }
}

module.exports = {
  Editable
}
