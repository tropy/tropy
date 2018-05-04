'use strict'

const React = require('react')
const { PureComponent } = React
const { FormattedMessage } = require('react-intl')
const { Input } = require('./input')
const { Select } = require('./select')
const cx = require('classnames')
const {
  arrayOf, bool, func, node, oneOf, number, string
} = require('prop-types')
const { noop } = require('../common/util')
const { GRID } = require('../constants/sass')
const { injectIntl, intlShape } = require('react-intl')
const { on, off } = require('../dom')


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
  get value() {
    return this.props.value || <FormattedMessage id={this.props.id}/>
  }

  render() {
    return (
      <label
        className={cx('control-label', `col-${this.props.size}`)}
        title={this.props.title}
        htmlFor={this.props.id}>
        {this.value}
      </label>
    )
  }

  static propTypes = {
    id: string.isRequired,
    size: number.isRequired,
    title: string,
    value: string
  }

  static defaultProps = {
    size: 4
  }
}

class FormElement extends PureComponent {
  get hasLabel() {
    return this.props.label || this.props.id != null
  }

  get offset() {
    return GRID.SIZE - this.props.size
  }

  render() {
    const { hasLabel, offset } = this

    return (
      <FormGroup isCompact={this.props.isCompact}>
        {hasLabel &&
          <Label
            id={this.props.id}
            size={offset}
            title={this.props.title}
            value={this.props.label}/>}
        <div className={
          cx(`col-${this.props.size}`, { [`col-offset-${offset}`]: !hasLabel })
        }>
          {this.props.children}
        </div>
      </FormGroup>
    )
  }

  static propTypes = {
    children: node,
    id: string,
    title: string,
    label: string,
    isCompact: bool,
    size: number.isRequired
  }

  static defaultProps = {
    size: 8
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

  handleChange = (value) => {
    this.props.onInputChange({ [this.props.name]: value })
  }

  handleCommit = (value, hasChanged) => {
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
        label={this.props.label}
        title={this.props.title}
        isCompact={this.props.isCompact}>
        <Input
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
          onChange={this.handleChange}
          onCommit={this.handleCommit}/>
      </FormElement>
    )
  }

  static propTypes = {
    id: string.isRequired,
    isCompact: bool,
    isDisabled: bool,
    isReadOnly: bool,
    isRequired: bool,
    label: string,
    name: string.isRequired,
    placeholder: string,
    size: number.isRequired,
    tabIndex: number,
    title: string,
    value: string,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onInputChange: func.isRequired
  }

  static defaultProps = {
    isReadOnly: false,
    size: 8,
    onBlur: noop,
    onChange: noop,
    onInputChange: noop
  }
}

class FormSelect extends PureComponent {
  optLabel = (opt) => (
    this.props.intl.formatMessage({
      id: `${this.props.id}s.${opt}`
    })
  )

  handleChange = (opt) => {
    this.props.onChange({
      [this.props.name]: opt
    })
  }

  render() {
    return (
      <FormElement
        id={this.props.id}
        size={this.props.size}
        isCompact={this.props.isCompact}>
        <Select
          id={this.props.id}
          isDisabled={this.props.isDisabled}
          isRequired={this.props.isRequired}
          onChange={this.handleChange}
          options={this.props.options}
          placeholder={this.props.placeholder}
          tabIndex={this.props.tabIndex}
          toText={this.optLabel}
          value={this.props.value}/>
      </FormElement>
    )
  }

  static propTypes = {
    id: string.isRequired,
    intl: intlShape,
    isCompact: bool,
    isDisabled: bool,
    isRequired: bool,
    name: string.isRequired,
    options: arrayOf(string).isRequired,
    placeholder: node,
    size: number.isRequired,
    tabIndex: number,
    value: string.isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    size: 8
  }
}


class Toggle extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      isTabFocus: false
    }
  }

  componentDidMount() {
    on(this.input, 'tab:focus', this.handleTabFocus)
  }

  componentWillUnmount() {
    off(this.input, 'tab:focus', this.handleTabFocus)
  }

  get classes() {
    return [
      this.props.className,
      this.props.type,
      { tab: this.state.isTabFocus }
    ]
  }

  get label() {
    return this.props.label || <FormattedMessage id={this.props.id}/>
  }

  setInput = (input) => {
    this.input = input
  }

  handleTabFocus = () => {
    this.setState({ isTabFocus: true })
  }

  handleBlur = (event) => {
    this.setState({ isTabFocus: false })
    if (this.props.onBlur) this.props.onBlur(event)
  }

  handleChange = () => {
    this.props.onChange({
      [this.props.name]: !this.props.value
    })
  }

  render() {
    return (
      <div className={cx(...this.classes)}>
        <label>
          <input
            ref={this.setInput}
            name={this.props.name}
            type={this.props.type}
            value={this.props.value}
            checked={!!this.props.value}
            disabled={this.props.isDisabled}
            tabIndex={this.props.tabIndex}
            onBlur={this.handleBlur}
            onFocus={this.props.onFocus}
            onChange={this.handleChange}/>
          {this.label}
        </label>
      </div>
    )
  }

  static propTypes = {
    className: string,
    id: string.isRequired,
    isDisabled: bool,
    name: string.isRequired,
    tabIndex: number,
    label: string,
    type: oneOf(['checkbox', 'radio']).isRequired,
    value: bool,
    onBlur: func,
    onFocus: func,
    onChange: func.isRequired
  }

  static defaultProps = {
    type: 'checkbox'
  }
}


class FormToggle extends PureComponent {
  get classes() {
    return [
      `col-${this.props.size}`,
      `col-offset-${GRID.SIZE - this.props.size}`,
    ]
  }

  render() {
    const { isCompact, ...props } = this.props

    return (
      <FormGroup isCompact={isCompact}>
        <Toggle className={cx(...this.classes)} {...props}/>
      </FormGroup>
    )
  }

  static propTypes = {
    ...Toggle.propTypes,
    size: number.isRequired,
    isCompact: bool,
    label: string
  }

  static defaultProps = {
    size: 8,
    type: 'checkbox'
  }
}

class FormToggleGroup extends PureComponent {
  handleChange = (option) => {
    for (let value in option) {
      if (option[value]) {
        this.props.onChange({ [this.props.name]: value })
      }
    }
  }

  render() {
    return (
      <FormElement
        id={`${this.props.id}.label`}
        size={this.props.size}
        isCompact={this.props.isCompact}>
        {this.props.options.map(value =>
          <Toggle
            id={`${this.props.id}.option.${value}`}
            key={value}
            name={value}
            tabIndex={this.props.tabIndex}
            type="radio"
            value={this.props.value === value}
            onChange={this.handleChange}/>)}
      </FormElement>
    )
  }

  static propTypes = {
    id: string.isRequired,
    isCompact: bool,
    isDisabled: bool,
    name: string.isRequired,
    options: arrayOf(string).isRequired,
    size: number.isRequired,
    tabIndex: number,
    value: string,
    onChange: func.isRequired
  }

  static defaultProps = {
    size: 8
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
    size: 8
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
    size: 8
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
  FormToggleGroup,
  Label,
  Toggle
}
