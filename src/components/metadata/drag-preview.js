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
      <React.Fragment>
        <div className="metadata-field drag-preview">
          <div>
            {item.value}
            {item.isMixed && <span>+</span>}
          </div>
        </div>
        {item.id.length &&
          <div className="badge">{item.id.length}</div>
        }
      </React.Fragment>
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
