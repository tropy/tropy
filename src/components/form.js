'use strict'

const React = require('react')
const { PureComponent } = React
const { FormattedMessage } = require('react-intl')
const cx = require('classnames')
const { bool, func, node, number, string } = require('prop-types')
const { noop } = require('../common/util')
const { GRID } = require('../constants/sass')


class FormGroup extends PureComponent {
  get classes() {
    return {
      'form-group': true,
      'compact': this.props.isCompact
    }
  }

  render() {
    return (
      <div className={cx(this.classes, this.props.className)}>
        {this.props.children}
      </div>
    )
  }

  static propTypes = {
    children: node,
    className: string,
    isCompact: bool
  }
}


class Label extends PureComponent {
  render() {
    return (
      <label
        className={cx('control-label', `col-${this.props.size}`)}
        htmlFor={this.props.id}>
        <FormattedMessage id={this.props.id}/>
      </label>
    )
  }

  static propTypes = {
    id: string.isRequired,
    size: number.isRequired
  }

  static defaultProps = {
    size: 3
  }
}


class FormField extends PureComponent {
  handleBlur = (event) => {
    this.props.onBlur(this.props.id, event)
  }

  handleChange = (event) => {
    this.props.onChange({
      [this.props.name]: event.target.value
    })
  }

  render() {
    return (
      <FormGroup isCompact={this.props.isCompact}>
        <Label
          id={this.props.id}
          size={GRID.SIZE - this.props.size}/>
        <div className={`col-${this.props.size}`}>
          <input
            id={this.props.id}
            className="form-control"
            name={this.props.name}
            placeholder={this.props.placeholder}
            tabIndex={this.props.tabIndex}
            type="text"
            value={this.props.value}
            readOnly={this.props.isReadOnly}
            onBlur={this.handleBlur}
            onChange={this.handleChange}/>
        </div>
      </FormGroup>
    )
  }

  static propTypes = {
    id: string.isRequired,
    isCompact: bool,
    isReadOnly: bool,
    name: string.isRequired,
    placeholder: string,
    size: number.isRequired,
    tabIndex: number,
    value: string.isRequired,
    onBlur: func.isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    isReadOnly: false,
    size: 9,
    onBlur: noop
  }
}

class FormText extends PureComponent {
  get isVisible() {
    return this.props.value || !this.props.isOptional
  }

  render() {
    return this.isVisible && (
      <FormGroup isCompact={this.props.isCompact}>
        <Label
          id={this.props.id}
          size={GRID.SIZE - this.props.size}/>
        <div className={`col-${this.props.size}`}>
          <div className="form-text">
            {this.props.value}
          </div>
        </div>
      </FormGroup>
    )
  }

  static propTypes = {
    id: string.isRequired,
    isCompact: bool,
    isOptional: bool,
    size: number.isRequired,
    value: string
  }

  static defaultProps = {
    size: 9
  }
}


module.exports = {
  Label,
  FormGroup,
  FormField,
  FormText
}
