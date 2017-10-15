'use strict'

const React = require('react')
const { PureComponent } = React
const { arrayOf, func, number, shape, string } = require('prop-types')
const { injectIntl, intlShape } = require('react-intl')
const { Editable } = require('../editable')


class TagAdder extends PureComponent {
  get placeholder() {
    const { count, intl } = this.props
    return intl.formatMessage({ id: 'panel.tags.add' }, { count })
  }

  focus() {
    this.editable.focus()
  }

  handleChange = (name) => {
    const pat = new RegExp(`^${name}$`, 'i')
    const tag = this.props.tags.find(t => pat.test(t.name))

    if (tag) {
      this.props.onAdd(tag)
    } else {
      this.props.onCreate({ name })
    }

    this.editable.input.reset()
  }

  handleBlur = () => true

  setEditable = (editable) => {
    this.editable = editable
  }

  render() {
    return (
      <div className="add-tag-container">
        <Editable
          ref={this.setEditable}
          isEditing
          isRequired
          autofocus={false}
          tabIndex={-1}
          type="text"
          value={''}
          placeholder={this.placeholder}
          onBlur={this.handleBlur}
          onCancel={this.props.onCancel}
          onChange={this.handleChange}/>
      </div>
    )
  }

  static propTypes = {
    count: number.isRequired,
    intl: intlShape.isRequired,
    tags: arrayOf(shape({
      id: number.isRequired,
      name: string.isRequired
    })),
    onAdd: func.isRequired,
    onCancel: func.isRequired,
    onCreate: func.isRequired
  }
}

module.exports = {
  TagAdder: injectIntl(TagAdder, { withRef: true })
}
