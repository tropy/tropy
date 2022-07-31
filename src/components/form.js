import React from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { Input } from './input'
import { FileSelect } from './file'
import { Select } from './select'
import cx from 'classnames'
import { noop, set } from '../common/util'
import { SASS } from '../constants'

import {
  arrayOf, bool, func, node, number, oneOf, string
} from 'prop-types'


export function Form(props) {
  return (
    <form className={cx('form-horizontal', props.className)}>
      {props.children}
    </form>
  )
}

Form.propTypes = {
  children: node,
  className: string
}

export class FormGroup extends React.PureComponent {
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


export const Label = React.memo(props => {
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

export class FormElement extends React.PureComponent {
  get hasLabel() {
    return this.props.label || this.props.id != null
  }

  get offset() {
    return SASS.GRID.SIZE - this.props.size
  }

  render() {
    const { hasLabel, offset } = this

    return (
      <FormGroup
        isCompact={this.props.isCompact}>
        {hasLabel &&
          <Label
            id={this.props.id}
            size={offset}
            title={this.props.title}
            value={this.props.label}/>}
        <div className={
          cx(`col-${this.props.size}`,
            this.props.className,
            { [`col-offset-${offset}`]: !hasLabel })
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


export class FormField extends React.PureComponent {
  input = React.createRef()

  get InputComponent() {
    switch (this.props.type) {
      case 'file':
      case 'directory':
        return FileSelect
      default:
        return Input
    }
  }

  reset() {
    if (this.input.current != null) {
      this.input.current.reset()
    }
  }

  handleBlur = (event) => {
    this.props.onBlur(this.props.id, event)
  }

  handleChange = (value) => {
    this.props.onInputChange(set({}, this.props.name, value))
  }

  handleCommit = (value, { hasChanged }) => {
    if (hasChanged) {
      this.props.onChange(set({}, this.props.name, value))
    }
  }

  render() {
    let { InputComponent } = this

    return (
      <FormElement
        id={this.props.id}
        size={this.props.size}
        label={this.props.label}
        title={this.props.title}
        isCompact={this.props.isCompact}>
        <InputComponent
          {...this.props}
          ref={this.input}
          className="form-control"
          value={this.props.value || ''}
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

export const FormSelect = (props) => {
  const intl = useIntl()

  return (
    <FormElement
      id={props.id}
      size={props.size}
      isCompact={props.isCompact}>
      <Select
        id={props.id}
        isDisabled={props.isDisabled}
        isInputHidden={props.isInputHidden}
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
  isInputHidden: bool,
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

export const Toggle = ({
  className,
  id,
  isDisabled,
  label,
  name,
  onBlur,
  onChange,
  onFocus,
  tabIndex,
  title,
  type,
  value
}) => (
  <div className={cx(className, type)}>
    <input
      checked={!!value}
      disabled={isDisabled}
      id={id}
      name={name}
      onBlur={onBlur}
      onChange={() => onChange({ [name]: !value }, true)}
      onFocus={onFocus}
      tabIndex={tabIndex}
      type={type}
      value={value}/>
    <label htmlFor={id} title={title}>
      {label || <FormattedMessage id={id}/>}
    </label>
  </div>
)

Toggle.propTypes = {
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

Toggle.defaultProps = {
  type: 'checkbox'
}


export class FormToggle extends React.PureComponent {
  get classes() {
    return [
      `col-${this.props.size}`,
      `col-offset-${SASS.GRID.SIZE - this.props.size}`
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

export class FormToggleGroup extends React.PureComponent {
  handleChange = (option) => {
    for (let value in option) {
      if (option[value]) {
        this.props.onChange(
          set({}, this.props.name, value === 'null' ? null : value)
        )
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
            key={`${value}`}
            name={`${value}`}
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

export class FormText extends React.PureComponent {
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

export class FormLink extends React.PureComponent {
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
