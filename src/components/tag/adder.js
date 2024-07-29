import React from 'react'
import { useIntl } from 'react-intl'
import { Input } from '../input.js'
import { blank, noop } from '../../common/util.js'
import { match } from '../../collate.js'

const TagAdderContainer = ({ children, count }) => {
  let intl = useIntl()
  let placeholder = intl.formatMessage({ id: 'panel.tags.add' }, { count })

  return (
    <div
      className="add-tag-container"
      style={{ '--placeholder': `"${placeholder.trim()}"` }}>
      {children}
    </div>
  )
}

export class TagAdder extends React.PureComponent {
  input = React.createRef()

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

  handleChange = (value, { isCompletion, event } = {}) => {
    if (blank(value))
      return this.props.onCancel()

    try {
      if (!isCompletion && (event?.shiftKey || event?.altKey)) {
        for (let name of value.split(this.props.separator)) {
          this.handleAddTag(name)
        }
      } else {
        this.handleAddTag(value)
      }

    } finally {
      this.input.current.reset()
    }
  }

  handleAddTag(name) {
    let query = name.trim().toLowerCase()
    let tag = this.props.tags.find(t => query === t.name.toLowerCase())

    if (tag)
      this.props.onAdd(tag)
    else
      this.props.onCreate({ name })
  }

  render() {
    return (
      <TagAdderContainer count={this.props.count}>
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
      </TagAdderContainer>
    )
  }

  static defaultProps = {
    match: (value, query) => (
      match(
        value.name || String(value),
        query,
        /^.|(?<=[\s\p{Punctuation}])(\d|\p{Alpha})/gmu)
    ),
    separator: /\s*[;,]\s*/,
    onCancel: noop,
    onFocus: noop
  }
}
