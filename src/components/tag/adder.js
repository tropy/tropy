'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { arrayOf, func, number, shape, string } = PropTypes
const { injectIntl, intlShape } = require('react-intl')
const { Editable } = require('../editable')


class TagAdder extends PureComponent {
  handleCancel = () => {
    document.body.focus()
  }

  handleChange = (name) => {
    const pat = new RegExp(`^${name}$`, 'i')
    const tag = this.props.tags.find(t => pat.test(t.name))

    if (tag) {
      this.props.onAdd(tag)
    } else {
      this.props.onCreate({ name })
    }

    this.editable.cancel()
  }

  handleBlur = () => true

  setEditable = (editable) => {
    this.editable = editable
  }

  render() {
    const { intl } = this.props

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
          placeholder={intl.formatMessage({ id: 'panel.tags.add' })}
          onBlur={this.handleBlur}
          onCancel={this.handleCancel}
          onChange={this.handleChange}/>
      </div>
    )
  }

  static propTypes = {
    intl: intlShape.isRequired,
    tags: arrayOf(shape({
      id: number.isRequired,
      name: string.isRequired
    })),
    onAdd: func.isRequired,
    onCreate: func.isRequired
  }
}

module.exports = {
  TagAdder: injectIntl(TagAdder)
}
