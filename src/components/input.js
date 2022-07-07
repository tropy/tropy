import React from 'react'
import { noop } from '../common/util'
import { AutoResizer } from './auto-resizer'
import { Completions } from './completions'

import {
  array, bool, func, number, oneOf, oneOfType, string
} from 'prop-types'


export class Input extends React.PureComponent {
  completions = React.createRef()
  input = React.createRef()

  state =  {
    hasFocus: false,
    key: this.props.value,
    query: '',
    value: this.props.value
  }

  static getDerivedStateFromProps(props, state) {
    return (props.value === state.key) ? null : {
      key: props.value,
      query: '',
      value: props.value
    }
  }

  componentDidMount() {
    if (this.props.autofocus)
      this.input.current.focus()
  }

  get completionsClassName() {
    return this.props.className ?
      `${this.props.className}-completions` : null
  }

  get isValid() {
    return this.input.current.validity.valid
  }

  get hasChanged() {
    return this.state.value !== this.state.key
  }

  get hasCompletions() {
    return this.state.hasFocus && this.props.completions.length > 0
  }

  cancel = (hasBeenForced) => {
    this.hasBeenCancelled = true

    if (this.isValid) {
      this.props.onCancel(this.hasChanged, hasBeenForced)
    } else {
      this.reset()
      this.props.onCancel(false, hasBeenForced)
    }
  }

  commit({ isCompletion, hasBeenForced } = {}, event) {
    if (this.isValid) {
      if (!this.hasBeenCommitted) {
        this.hasBeenCommitted = true
        this.props.onCommit(this.state.value, {
          hasChanged: this.hasChanged,
          isCompletion,
          hasBeenForced,
          event
        })
      }
    } else {
      this.cancel()
    }
  }

  focus = () => {
    this.input.current?.focus()
  }

  select = () => {
    this.input.current?.setSelectionRange(
      0,
      this.input.current.value.length,
      'backward'
    )
  }

  reset() {
    this.hasBeenCancelled = false
    this.hasBeenCommitted = false

    this.setState({
      key: this.props.value,
      query: '',
      value: this.props.value
    })
  }

  handleBlur = (event) => {
    let cancel = this.props.onBlur(event)
    this.setState({ hasFocus: false })

    if (this.hasBeenCancelled || this.hasBeenCommitted)
      return null
    if (cancel)
      this.cancel()
    else
      this.commit({}, event)
  }

  handleFocus = (event) => {
    this.props.onFocus(event)

    if (this.props.autoselect)
      this.select()

    this.hasBeenCancelled = false
    this.hasBeenCommitted = false

    this.setState({
      hasFocus: true
    })
  }

  handleChange = ({ target }) => {
    this.setState({ value: target.value, query: target.value })
    this.props.onChange(target.value)
  }

  handleCompletion = (value) => {
    this.setState({ value }, () =>
      this.commit({ hasBeenForced: true, isCompletion: true }))
    this.props.onChange(value)
  }

  handleKeyDown = (event) => {
    if (this.props.onKeyDown != null) {
      if (this.props.onKeyDown(event, this))
        return null
    }

    // TODO Some Editables (e.g., in ItemTable expect active Inputs
    // to swallow all key presses; ideally, they should remove their
    // own key bindings while an Input is active.
    event.stopPropagation()

    if (!this.handleCompletionsKeyDown(event)) {
      switch (event.key) {
        case 'Escape':
          this.cancel(true)
          break
        case 'Enter':
          this.commit({ hasBeenForced: true }, event)
          break
        default:
          return null
      }
    }

    // Prevent default and global bindings if we handled the key!
    event.preventDefault()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleCompletionsKeyDown(event) {
    let opt = null
    let completions = this.completions.current

    if (!completions?.isVisible)
      return false

    switch (event.key) {
      case 'ArrowDown':
        opt = event.altKey ?
          completions.last() :
          completions.next()
        break
      case 'ArrowUp':
        opt = event.altKey ?
          completions.first() :
          completions.prev()
        break
      case 'Home':
        opt = completions.first()
        break
      case 'End':
        opt = completions.last()
        break
      case 'PageUp':
        opt = completions.pageUp()
        break
      case 'PageDown':
        opt = completions.pageDown()
        break
      case 'Enter':
        if (completions.state.active == null)
          return false

        this.handleCompletion(completions.state.active)
        return true
      default:
        return false
    }

    this.setState({
      value: opt?.value ?? this.state.query
    })

    return true
  }

  render() {
    return (
      <div className="input-group">
        <AutoResizer
          content={this.state.value}
          isDisabled={!this.props.resize}>
          <input
            className={this.props.className}
            disabled={this.props.isDisabled}
            id={this.props.id}
            placeholder={this.props.placeholder}
            readOnly={this.props.isReadOnly}
            ref={this.input}
            required={this.props.isRequired}
            tabIndex={this.props.tabIndex}
            type={this.props.type}
            max={this.props.max}
            min={this.props.min}
            value={this.state.value}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            onFocus={this.handleFocus}
            onKeyDown={this.handleKeyDown}/>
        </AutoResizer>
        {this.hasCompletions &&
          <Completions
            className={this.completionsClassName}
            completions={this.props.completions}
            isAdvisory
            isExactMatchHidden
            match={this.props.match}
            minQueryLength={1}
            onClickOutside={this.cancel}
            onSelect={this.handleCompletion}
            parent={this.input.current}
            query={this.state.query}
            ref={this.completions}/>}
      </div>
    )
  }

  static propTypes = {
    autofocus: bool,
    autoselect: bool,
    completions: array.isRequired,
    className: string,
    id: string,
    isDisabled: bool,
    isReadOnly: bool,
    isRequired: bool,
    match: func.isRequired,
    max: number,
    min: number,
    placeholder: string,
    resize: bool,
    tabIndex: number,
    type: oneOf(['text', 'number']).isRequired,
    value: oneOfType([string, number]).isRequired,
    onBlur: func.isRequired,
    onCancel: func.isRequired,
    onChange: func.isRequired,
    onCommit: func.isRequired,
    onFocus: func.isRequired,
    onKeyDown: func
  }

  static defaultProps = {
    completions: [],
    match: Completions.defaultProps.match,
    tabIndex: -1,
    type: 'text',
    onBlur: noop,
    onCancel: noop,
    onChange: noop,
    onCommit: noop,
    onFocus: noop
  }
}
