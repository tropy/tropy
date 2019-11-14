'use strict'

const React = require('react')
const { FormattedMessage, useIntl } = require('react-intl')
const { Input } = require('./input')
const { Select } = require('./select')
const cx = require('classnames')
const {
  arrayOf, bool, func, node, number, oneOf, string
} = require('prop-types')
const { noop } = require('../common/util')
const { GRID } = require('../constants/sass')
const { on, off } = require('../dom')


class FormGroup extends React.PureComponent {
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


const Label = React.memo(props => {
  let intl = useIntl()

  let title = props.title && intl.formatMessage({ id: props.title })
  let value = props.value || intl.formatMessage({ id: props.id })

  return (
    <label
      className={cx('control-label', `col-${props.size}`)}
      title={title}
      htmlFor={props.id}>
      {value}
    </label>
  )
})

Label.propTypes = {
  id: string.isRequired,
  size: number.isRequired,
  title: string,
  value: string
}

Label.defaultProps = {
  size: 4
}

class FormElement extends React.PureComponent {
  get hasLabel() {
    return this.props.label || this.props.id != null
  }

  get offset() {
    return GRID.SIZE - this.props.size
  }

  render() {
    const { hasLabel, offset } = this

    return (
      <FormGroup
        isCompact={this.props.isCompact}
        className={cx(this.props.className)}>
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
    className: string,
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


class FormField extends React.PureComponent {
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
          max={this.props.max}
          min={this.props.min}
          name={this.props.name}
          placeholder={this.props.placeholder}
          tabIndex={this.props.tabIndex}
          type={this.props.type}
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
    max: number,
    min: number,
    name: string.isRequired,
    placeholder: string,
    size: number.isRequired,
    tabIndex: number,
    type: string.isRequired,
    title: string,
    value: string,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onInputChange: func.isRequired
  }

  static defaultProps = {
    isReadOnly: false,
    size: 8,
    type: 'text',
    onBlur: noop,
    onChange: noop,
    onInputChange: noop
  }
}

const FormSelect = (props) => {
  const intl = useIntl()

  return (
    <FormElement
      id={props.id}
      size={props.size}
      isCompact={props.isCompact}>
      <Select
        id={props.id}
        isDisabled={props.isDisabled}
        isRequired={props.isRequired}
        isSelectionHidden={props.isSelectionHidden}
        name={props.name}
        onChange={props.onChange}
        options={props.options}
        placeholder={props.placeholder}
        tabIndex={props.tabIndex}
        toText={opt => intl.formatMessage({ id: `${props.id}s.${opt}` })}
        value={props.value}/>
    </FormElement>
  )
}

FormSelect.propTypes = {
  id: string.isRequired,
  isCompact: bool,
  isDisabled: bool,
  isRequired: bool,
  isSelectionHidden: bool,
  name: string.isRequired,
  options: arrayOf(string).isRequired,
  placeholder: node,
  size: number.isRequired,
  tabIndex: number,
  value: string.isRequired,
  onChange: func.isRequired
}

FormSelect.defaultProps = {
  size: 8
}

class Toggle extends React.PureComponent {
  state = {
    isTabFocus: false
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
    }, true)
  }

  render() {
    return (
      <div className={cx(...this.classes)}>
        <input
          id={this.props.id}
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
        <label htmlFor={this.props.id}>
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


class FormToggle extends React.PureComponent {
  get classes() {
    return [
      `col-${this.props.size}`,
      `col-offset-${GRID.SIZE - this.props.size}`
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

class FormToggleGroup extends React.PureComponent {
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

class FormText extends React.PureComponent {
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

class FormLink extends React.PureComponent {
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
  FormSelect,
  FormText,
  FormToggle,
  FormToggleGroup,
  Label,
  Toggle
}
