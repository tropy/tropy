'use strict'

const React = require('react')

const {
  arrayOf,
  number,
  oneOfType,
  shape,
  string
} = require('prop-types')


class FieldDragPreview extends React.PureComponent {

  render() {
    const item = this.props.items[0]
    return (
      <div className="metadata-field drag-preview copy">
        <div>
          {item.value}
          {item.isMixed && <span>+</span>}
        </div>
        {item.id.length &&
          <div className="badge">{item.id.length}</div>
        }
      </div>
    )

  }

  static propTypes = {
    items: arrayOf(shape({
      id: oneOfType([number, arrayOf(number)]).isRequired,
      value: string.isRequired
    })).isRequired,
  }

}

module.exports = {
  FieldDragPreview
}
