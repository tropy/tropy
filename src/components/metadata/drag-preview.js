'use strict'

const React = require('react')
const cx = require('classnames')

const {
  arrayOf,
  number,
  oneOfType,
  shape,
  string
} = require('prop-types')


class FieldDragPreview extends React.PureComponent {
  get classes() {
    return ['metadata-field', 'drag-preview', 'copy']
  }

  render() {
    const item = this.props.items[0]
    return (
      <div className={cx(this.classes)}>
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
