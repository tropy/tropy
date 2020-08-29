import React from 'react'
import { injectIntl } from 'react-intl'
import { Input } from '../input'
import { blank, noop } from '../../common/util'
import { match } from '../../collate'

import {
  arrayOf,
  bool,
  func,
  number,
  object,
  shape,
  string
} from 'prop-types'


class TagAdder extends React.PureComponent {
  input = React.createRef()

  get placeholder() {
    let { count, intl } = this.props
    return {
      '--placeholder': `"${
        intl.formatMessage({ id: 'panel.tags.add' }, { count }).trim()
      }"`
    }
  }

  focus() {
    this.input.current.focus()
  }

  handleCancel = (hasChanged) => {
    if (hasChanged)
      this.input.current.reset()
    else
      this.props.onCancel()
  }

  handleBlur = (event) => {
    this.props.onBlur(event)
    this.input.current.reset()
    return true // Always cancel on blur!
  }

  handleChange = (name) => {
    if (blank(name))
      return this.props.onCancel()

    let query = name.trim().toLowerCase()
    let tag = this.props.tags.find(t => query === t.name.toLowerCase())

    if (tag)
      this.props.onAdd(tag)
    else
      this.props.onCreate({ name })

    this.input.current.reset()
  }

  render() {
    return (
      <div
        className="add-tag-container"
        style={this.placeholder}>
        <Input
          ref={this.input}
          className="form-control"
          completions={this.props.completions}
          isDisabled={this.props.isDisabled}
          match={this.props.match}
          tabIndex={-1}
          value=""
          onBlur={this.handleBlur}
          onFocus={this.props.onFocus}
          onCancel={this.handleCancel}
          onCommit={this.handleChange}/>
      </div>
    )
  }

  static propTypes = {
    count: number.isRequired,
    completions: arrayOf(string).isRequired,
    intl: object.isRequired,
    isDisabled: bool,
    match: func.isRequired,
    tags: arrayOf(shape({
      id: number.isRequired,
      name: string.isRequired
    })),
    onAdd: func.isRequired,
    onBlur: func.isRequired,
    onCancel: func.isRequired,
    onFocus: func.isRequired,
    onCreate: func.isRequired
  }

  static defaultProps = {
    match: (value, query) => (
      match(value.name || String(value), query, /\b\w/g)
    ),
    onCancel: noop,
    onFocus: noop
  }
}

const TagAdderContainer = injectIntl(TagAdder, { forwardRef: true })

export {
  TagAdderContainer as TagAdder
}
