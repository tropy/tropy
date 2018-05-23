'use strict'

const React = require('react')
const { PureComponent } = React
const { injectIntl, intlShape } = require('react-intl')
const { Input } = require('../input')
const { blank, noop } = require('../../common/util')
const { arrayOf, bool, func, number, shape, string } = require('prop-types')


class TagAdder extends PureComponent {
  get placeholder() {
    const { count, intl } = this.props
    return intl.formatMessage({ id: 'panel.tags.add' }, { count })
  }

  focus() {
    this.input.focus()
  }

  handleBlur = (event) => {
    this.props.onBlur(event)
    return true // cancel on blur
  }

  handleChange = (name) => {
    if (blank(name)) return this.props.onCancel()

    const query = name.trim().toLowerCase()
    const tag = this.props.tags.find(t => query === t.name.toLowerCase())

    if (tag) {
      this.props.onAdd(tag)
    } else {
      this.props.onCreate({ name })
    }

    this.input.reset()
  }

  setInput = (input) => {
    this.input = input
  }

  render() {
    return (
      <div className="add-tag-container">
        <Input
          ref={this.setInput}
          className="form-control"
          completions={this.props.completions}
          isDisabled={this.props.isDisabled}
          placeholder={this.placeholder}
          tabIndex={-1}
          value=""
          onBlur={this.handleBlur}
          onFocus={this.props.onFocus}
          onCancel={this.props.onCancel}
          onCommit={this.handleChange}/>
      </div>
    )
  }

  static propTypes = {
    count: number.isRequired,
    completions: arrayOf(string).isRequired,
    intl: intlShape.isRequired,
    isDisabled: bool,
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
    onFocus: noop
  }
}

module.exports = {
  TagAdder: injectIntl(TagAdder, { withRef: true })
}
