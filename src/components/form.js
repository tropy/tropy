import React from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import cx from 'classnames'
import { useEvent } from '../hooks/use-event.js'
import { set } from '../common/util.js'
import { Input } from './input.js'
import { FileSelect } from './file.js'
import { Select } from './select.js'
import { Slider } from './slider.js'
import { SASS } from '../constants/index.js'

const gridColumns = (size) =>
  `${SASS.GRID.SIZE - size}fr ${size}fr`

export const Form = ({
  children,
  className,
  ref,
  size,
  style,
  ...props
}) => (
  <form
    ref={ref}
    className={cx({ 'form-horizontal': size }, className)}
    style={size ? { ...style, '--grid-columns': gridColumns(size) } : style}
    {...props}>
    {children}
  </form>
)

export const FormGroup = ({ children, className, isCompact }) => (
  <div className={cx('form-group', className, {
    compact: isCompact
  })}>
    {children}
  </div>
)

export const Label = React.memo(({ className, id, title, value }) => {
  let intl = useIntl()

  return (
    <label
      className={className}
      title={title && intl.formatMessage({ id: title })}
      htmlFor={id}>
      {intl.formatMessage({ id: value || id })}
    </label>
  )
})

export const Description = (props = {}) => {
  return (
    <p className="form-description">
      <FormattedMessage {...props}/>
    </p>
  )
}

export class FormElement extends React.PureComponent {
  get hasLabel () {
    return this.props.label || this.props.id != null
  }

  render () {
    return (
      <FormGroup
        isCompact={this.props.isCompact}>
        {this.hasLabel && (
          <Label
            className="control-label cell"
            id={this.props.id}
            title={this.props.title}
            value={this.props.label}/>
        )}
        <div className={cx('cell', this.props.className)}>
          {this.props.children}
          {this.props.description &&
            <Description id={this.props.description}/>}
        </div>
      </FormGroup>
    )
  }
}


export class FormField extends React.PureComponent {
  input = React.createRef()

  get InputComponent () {
    switch (this.props.type) {
      case 'file':
      case 'directory':
        return FileSelect
      default:
        return Input
    }
  }

  reset () {
    if (this.input.current != null) {
      this.input.current.reset()
    }
  }

  handleBlur = (event) => {
    this.props.onBlur?.(this.props.id, event)
  }

  handleChange = (value) => {
    this.props.onInputChange?.(set({}, this.props.name, value))
  }

  handleCommit = (value, { hasChanged }) => {
    if (hasChanged) {
      this.props.onChange?.(set({}, this.props.name, value))
    }
  }

  render () {
    let { InputComponent } = this

    return (
      <FormElement
        id={this.props.id}
        description={this.props.description}
        label={this.props.label}
        title={this.props.title}
        isCompact={this.props.isCompact}>
        <InputComponent
          {...this.props}
          ref={this.input}
          className="form-control"
          name={this.props.name}
          value={this.props.value || ''}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          onCommit={this.handleCommit}/>
      </FormElement>
    )
  }

  static defaultProps = {
    isReadOnly: false,
    type: 'text'
  }
}

export const FormSelect = (props) => {
  const intl = useIntl()

  return (
    <FormElement
      id={props.id}
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

export const Toggle = ({
  children,
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
  type = 'checkbox',
  value
}) => {
  let checked = isChecked ?? value === true

  let handleChange = useEvent(() => {
    let inverse = (typeof value === 'boolean' || value === undefined) ?
        !value :
      checked ? null : value

    onChange(set({}, name, inverse), true)
  })

  return (
    <div className={cx(className || type)}>
      <input
        checked={checked}
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
      {children}
    </div>
  )
}


export const FormToggle = ({
  isCompact,
  type = 'checkbox',
  ...props
}) => (
  <FormGroup isCompact={isCompact}>
    <Toggle
      {...props}
      type={type}
      className={cx(type, 'cell')}/>
  </FormGroup>
)

export const FormSlider = ({
  id,
  isCompact,
  isDisabled,
  name,
  onChange,
  tabIndex = 0,
  value
}) => {
  let handleChange = useEvent((next) => {
    onChange(set({}, name, next))
  })

  return (
    <FormElement id={`${id}.label`} isCompact={isCompact}>
      <Slider
        isDisabled={isDisabled}
        precision={100}
        showCurrentValue
        tabIndex={tabIndex}
        value={value}
        format={`${id}.value`}
        onChange={handleChange}/>
    </FormElement>
  )
}

export const FormToggleGroup = ({
  id,
  isCompact,
  name,
  onChange,
  options,
  tabIndex,
  value
}) => (
  <FormElement
    id={`${id}.label`}
    isCompact={isCompact}>
    {options.map(option => (
      <Toggle
        id={`${id}.option.${option}`}
        isChecked={option === value}
        key={`${option}`}
        name={name}
        onChange={onChange}
        tabIndex={tabIndex}
        type="radio"
        value={option}/>
    ))}
  </FormElement>
)

export class FormText extends React.PureComponent {
  get isVisible () {
    return this.props.value || !this.props.isOptional
  }

  render () {
    return this.isVisible && (
      <FormElement
        id={this.props.id}
        isCompact={this.props.isCompact}>
        <div className="form-text">
          {this.props.value}
        </div>
      </FormElement>
    )
  }
}

export class FormLink extends React.PureComponent {
  get isVisible () {
    return this.props.value || !this.props.isOptional
  }

  handleClick = () => {
    this.props.onClick(this.props.value)
  }

  render () {
    return this.isVisible && (
      <FormElement
        id={this.props.id}
        isCompact={this.props.isCompact}>
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
}
