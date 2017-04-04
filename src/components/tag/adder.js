'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { arrayOf, func, number, shape, string } = PropTypes
const { injectIntl, intlShape } = require('react-intl')
const { Editable } = require('../editable')

class TagAdder extends PureComponent {

  handleCancel = () => {
  }

  handleChange = () => {
  }

  render() {
    const { intl } = this.props

    return (
      <div className="add-tag-container">
        <Editable
          isEditing
          autofocus={false}
          type="text"
          tabIndex={-1}
          placeholder={intl.formatMessage({ id: 'panel.tags.add' })}
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
