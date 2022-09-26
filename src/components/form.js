import React from 'react'
import { useIntl } from 'react-intl'
import cx from 'classnames'
import { useEvent } from '../hooks/use-event.js'
import { set } from '../common/util.js'
import { Input } from './input.js'
import { FileSelect } from './file.js'
import { Select } from './select.js'
import { SASS } from '../constants/index.js'

import {
  arrayOf, bool, func, node, number, oneOf, oneOfType, string
} from 'prop-types'


export const Form = ({ children, className }) => (
  <form className={cx('form-horizontal', className)}>
    {children}
  </form>
)

Form.propTypes = {
  children: node,
  className: string
}


export const FormGroup = ({ children, className, isCompact }) => (
  <div className={cx('form-group', className, {
    compact: isCompact
  })}>
    {children}
  </div>
)

FormGroup.propTypes = {
  children: node,
  className: string,
  isCompact: bool
}


export const Label = React.memo(({ className, id, size, title, value }) => {
  let intl = useIntl()

  return (
    <label
      className={cx(className, size && ['control-label', `col-${size}`])}
      title={title && intl.formatMessage({ id: title })}
      htmlFor={id}>
      {intl.formatMessage({ id: value || id })}
    </label>
  )
})

Label.propTypes = {
  className: string,
  id: string.isRequired,
  size: number,
  title: string,
  value: string
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
    this.props.onBlur?.(this.props.id, event)
  }

  handleChange = (value) => {
    this.props.onInputChange?.({ [this.props.name]: value })
  }

  handleCommit = (value, { hasChanged }) => {
    if (hasChanged) {
      this.props.onChange?.({ [this.props.name]: value })
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
    onBlur: func,
    onChange: func,
    onInputChange: func
  }

  static defaultProps = {
    isReadOnly: false,
    size: 8,
    type: 'text'
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
  isChecked,
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
}) => {
  isChecked ??= value === true

  let handleChange = useEvent(() => {
    let inverse =  (typeof value === 'boolean') ?
      !value :
      isChecked ? null : value

    onChange(set({}, name, inverse), true)
  })

  return (
    <div className={cx(className || type)}>
      <input
        checked={isChecked}
        disabled={isDisabled}
        id={id}
        name={name}
        onBlur={onBlur}
        onChange={handleChange}
        onFocus={onFocus}
        tabIndex={tabIndex}
        type={type}
        value={`${value}`}/>
      <Label id={id} title={title} value={label}/>
    </div>
  )
}

Toggle.propTypes = {
  className: string,
  id: string.isRequired,
  isChecked: bool,
  isDisabled: bool,
  name: string.isRequired,
  tabIndex: number,
  label: string,
  type: oneOf(['checkbox', 'radio']).isRequired,
  value: oneOfType([bool, string]),
  onBlur: func,
  onFocus: func,
  onChange: func.isRequired
}

Toggle.defaultProps = {
  type: 'checkbox'
}


export const FormToggle = ({ isCompact, size, ...props }) => (
  <FormGroup isCompact={isCompact}>
    <Toggle {...props} className={
      cx(props.type, `col-${size}`, `col-offset-${SASS.GRID.SIZE - size}`)
    }/>
  </FormGroup>
)

FormToggle.propTypes = {
  ...Toggle.propTypes,
  size: number.isRequired,
  isCompact: bool
}

FormToggle.defaultProps = {
  size: 8,
  type: 'checkbox'
}

export const FormToggleGroup = ({
  id,
  isCompact,
  name,
  onChange,
  options,
  size,
  tabIndex,
  value
}) => (
  <FormElement
    id={`${id}.label`}
    size={size}
    isCompact={isCompact}>
    {options.map(option =>
      <Toggle
        id={`${id}.option.${option}`}
        isChecked={option === value}
        key={`${option}`}
        name={name}
        onChange={onChange}
        tabIndex={tabIndex}
        type="radio"
        value={option}/>)}
  </FormElement>
)

FormToggleGroup.propTypes = {
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

FormToggleGroup.defaultProps = {
  size: 8
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
