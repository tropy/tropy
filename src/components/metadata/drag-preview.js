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
    const field = this.props.field
    return (
      <React.Fragment>
        <div className="metadata-field drag-preview">
          <div>
            {field.value}
            {field.isMixed && <span>+</span>}
          </div>
        </div>
        {field.id.length &&
          <div className="badge">{field.id.length}</div>
        }
      </React.Fragment>
    )
  }

  static propTypes = {
    field: shape({
      id: oneOfType([number, arrayOf(number)]).isRequired,
      value: string.isRequired
    }).isRequired,
  }

}

module.exports = {
  FieldDragPreview
}
