'use strict'

const React = require('react')
const { PureComponent } = React
const { injectIntl, intlShape } = require('react-intl')
const { Editable } = require('../editable')
const { blank } = require('../../common/util')
const { arrayOf, bool, func, number, shape, string } = require('prop-types')


class TagAdder extends PureComponent {
  get placeholder() {
    const { count, intl } = this.props
    return intl.formatMessage({ id: 'panel.tags.add' }, { count })
  }

  focus() {
    this.editable.focus()
  }

  handleBlur = (event) => {
    this.props.onBlur(event)
    return true // cancel on blur
  }

  handleChange = (name) => {
    if (blank(name)) return this.props.onCancel()

    const pat = new RegExp(`^${name}$`, 'i')
    const tag = this.props.tags.find(t => pat.test(t.name))

    if (tag) {
      this.props.onAdd(tag)
    } else {
      this.props.onCreate({ name })
    }

    this.editable.input.reset()
  }

  setEditable = (editable) => {
    this.editable = editable
  }

  render() {
    return (
      <div className="add-tag-container">
        <Editable
          ref={this.setEditable}
          autofocus={false}
          isDisabled={this.props.isDisabled}
          isEditing
          tabIndex={-1}
          type="text"
          value=""
          placeholder={this.placeholder}
          onBlur={this.handleBlur}
          onFocus={this.props.onFocus}
          onCancel={this.props.onCancel}
          onChange={this.handleChange}/>
      </div>
    )
  }

  static propTypes = {
    count: number.isRequired,
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
}

module.exports = {
  TagAdder: injectIntl(TagAdder, { withRef: true })
}
