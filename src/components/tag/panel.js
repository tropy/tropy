'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { arrayOf, func, number, object, shape, string } = PropTypes
const { TagList } = require('./list')

const noop = () => {}

class TagPanel extends PureComponent {

  handleContextMenu = (event, tag) => {
    this.props.onContextMenu(event, 'item-tag', {
      id: tag.id,
      mixed: tag.mixed,
      items: this.props.items.map(it => it.id)
    })
  }

  render() {
    return (
      <div className="tag list tab-pane">
        <TagList
          edit={this.props.edit}
          tags={this.props.tags}
          onEditCancel={this.props.onEditCancel}
          onSave={noop}
          onContextMenu={this.handleContextMenu}/>

        <div className="add-tag-container">
          <input
            type="text"
            className="form-control add-tag"
            tabIndex={-1}
            placeholder="Add tags"/>
        </div>
      </div>
    )
  }

  static propTypes = {
    edit: object,

    items: arrayOf(shape({
      id: number.isRequired,
    })).isRequired,

    tags: arrayOf(shape({
      id: number.isRequired,
      name: string.isRequired
    })).isRequired,

    onContextMenu: func.isRequired,
    onEditCancel: func.isRequired
  }
}

module.exports = {
  TagPanel
}
