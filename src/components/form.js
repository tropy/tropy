'use strict'

const React = require('react')
const { PureComponent } = React
const { FormattedMessage } = require('react-intl')
const { BufferedInput } = require('./input')
const cx = require('classnames')
const { arrayOf, bool, func, node, number, string } = require('prop-types')
const { noop } = require('../common/util')
const { GRID } = require('../constants/sass')
const { injectIntl, intlShape } = require('react-intl')


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

class FormElement extends PureComponent {
  render() {
    return (
      <FormGroup isCompact={this.props.isCompact}>
        <Label
          id={this.props.id}
          size={GRID.SIZE - this.props.size}/>
        <div className={`col-${this.props.size}`}>
          {this.props.children}
        </div>
      </FormGroup>
    )
  }

  static propTypes = {
    children: node,
    id: string.isRequired,
    isCompact: bool,
    size: number.isRequired
  }

  static defaultProps = {
    size: 9
  }
}


class FormField extends PureComponent {
  reset() {
    if (this.input != null) this.input.reset()
  }

  setInput = (input) => {
    this.input = input
  }

  handleBlur = (event) => {
    this.props.onBlur(this.props.id, event)
  }

  handleChange = (value, hasChanged) => {
    if (hasChanged) {
      this.props.onChange({
        [this.props.name]: value
      })
    }
  }

  render() {
    return (
      <FormElement
        id={this.props.id}
        size={this.props.size}
        isCompact={this.props.isCompact}>
        <BufferedInput
          ref={this.setInput}
          id={this.props.id}
          className="form-control"
          name={this.props.name}
          placeholder={this.props.placeholder}
          tabIndex={this.props.tabIndex}
          type="text"
          value={this.props.value || ''}
          isDisabled={this.props.isDisabled}
          isReadOnly={this.props.isReadOnly}
          isRequired={this.props.isRequired}
          onBlur={this.handleBlur}
          onCommit={this.handleChange}/>
      </FormElement>
    )
  }

  static propTypes = {
    id: string.isRequired,
    isCompact: bool,
    isDisabled: bool,
    isReadOnly: bool,
    isRequired: bool,
    name: string.isRequired,
    placeholder: string,
    size: number.isRequired,
    tabIndex: number,
    value: string,
    onBlur: func.isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    isReadOnly: false,
    size: 9,
    onBlur: noop
  }
}

class FormSelect extends PureComponent {
  optLabel = (opt) => (
    this.props.intl.formatMessage({
      id: `${this.props.id}s.${opt}`
    })
  )

  handleChange = (event) => {
    this.props.onChange({
      [this.props.name]: event.target.value
    })
  }

  render() {
    return (
      <FormElement
        id={this.props.id}
        size={this.props.size}
        isCompact={this.props.isCompact}>
        <select
          id={this.props.id}
          className="form-control"
          name={this.props.name}
          tabIndex={this.props.tabIndex}
          value={this.props.value}
          disabled={this.props.isDisabled}
          onChange={this.handleChange}>
          {this.props.options.map((opt) =>
            <option key={opt} value={opt}>{this.optLabel(opt)}</option>)}
        </select>
      </FormElement>
    )
  }

  static propTypes = {
    id: string.isRequired,
    intl: intlShape,
    isCompact: bool,
    isDisabled: bool,
    name: string.isRequired,
    options: arrayOf(string).isRequired,
    size: number.isRequired,
    tabIndex: number,
    value: string.isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    size: 9
  }
}

class FormToggle extends PureComponent {
  get classes() {
    return [
      `col-${this.props.size}`,
      `col-offset-${GRID.SIZE - this.props.size}`,
      'checkbox'
    ]
  }

  handleChange = (event) => {
    this.props.onChange({
      [this.props.name]: !!event.target.value
    })
  }

  render() {
    return (
      <FormGroup isCompact={this.props.isCompact}>
        <div class-name={cx(...this.classes)}>
          <label className={cx('control-label', `col-${this.props.size}`)}>
            <input
              name={this.props.name}
              type="checkbox"
              value={this.props.value}
              checked={!!this.props.value}
              disabled={this.props.isDisabled}
              tabIndex={this.props.tabIndex}
              onChange={this.handleChange}/>
            <FormattedMessage id={this.props.id}/>
          </label>
        </div>
      </FormGroup>
    )
  }

  static propTypes = {
    id: string.isRequired,
    isCompact: bool,
    isDisabled: bool,
    name: string.isRequired,
    size: number.isRequired,
    tabIndex: number,
    value: bool.isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    size: 9
  }
}

class FormText extends PureComponent {
  get isVisible() {
    return this.props.value || !this.props.isOptional
  }

  render() {
    return this.isVisible && (
      <FormElement
        id={this.props.id}
        isCompact={this.props.isCompact}
        size={this.props.size}>
        <div className="form-text">
          {this.props.value}
        </div>
      </FormElement>
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

class FormLink extends PureComponent {
  get isVisible() {
    return this.props.value || !this.props.isOptional
  }

  handleClick = () => {
    this.props.onClick(this.props.value)
  }

  render() {
    return this.isVisible && (
      <FormElement
        id={this.props.id}
        isCompact={this.props.isCompact}
        size={this.props.size}>
        <div className="form-text">
          <a
            tabIndex={-1}
            className="form-link"
            onClick={this.handleClick}>
            {this.props.value}
          </a>
        </div>
      </FormElement>
    )
  }

  static propTypes = {
    id: string.isRequired,
    isCompact: bool,
    isOptional: bool,
    size: number.isRequired,
    value: string,
    onClick: func.isRequired
  }

  static defaultProps = {
    size: 9
  }
}


module.exports = {
  FormElement,
  FormField,
  FormGroup,
  FormLink,
  FormSelect: injectIntl(FormSelect),
  FormText,
  FormToggle,
  Label
}
