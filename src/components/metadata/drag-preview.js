'use strict'

const React = require('react')
const cx = require('classnames')
const { arrayOf, shape, string } = require('prop-types')


class FieldDragPreview extends React.PureComponent {
  get classes() {
    return ['metadata-field', 'drag-preview', 'copy']
  }

  render() {
    const item = this.props.items[0]
    return (
      <div className={cx(this.classes)}>
        <div>
          {item.text}
          {item.isMixed && <span>+</span>}
        </div>
        {item.itemsSelected.length > 1 &&
          <div className="badge">{item.itemsSelected.length}</div>
        }
      </div>
    )

  }

  static propTypes = {
    items: arrayOf(shape({
      id: string.isRequired,
      label: string.isRequired
    })).isRequired,
  }

}

module.exports = {
  FieldDragPreview
}
