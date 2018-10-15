'use strict'

const React = require('react')
const { IconFolder } = require('../icons')
const { shape, string } = require('prop-types')


class ListDragPreview extends React.PureComponent {
  render() {
    return (
      <div className="list drag-preview">
        <IconFolder/>
        <div className="name">
          {this.props.list.name}
        </div>
      </div>
    )
  }

  static propTypes = {
    list: shape({
      name: string.isRequired
    }).isRequired
  }
}

module.exports = {
  ListDragPreview
}
