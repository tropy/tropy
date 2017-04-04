'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { arrayOf, func, number, object, shape, string } = PropTypes
const { connect } = require('react-redux')
const { getItemTags } = require('../../selectors')
const { TagList } = require('./list')


class TagPanel extends PureComponent {

  handleTagRemove = (tag) => {
    this.props.onItemTagRemove({
      id: this.props.items, tags: [tag]
    })
  }

  handleContextMenu = (event, tag) => {
    this.props.onContextMenu(event, 'item-tag', {
      id: tag.id,
      mixed: tag.mixed,
      items: this.props.items
    })
  }

  render() {
    return (
      <div className="tab-pane">
        <TagList
          edit={this.props.edit}
          keymap={this.props.keymap}
          tags={this.props.tags}
          hasFocusIcon
          onEditCancel={this.props.onEditCancel}
          onRemove={this.handleTagRemove}
          onSave={this.props.onTagSave}
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
    items: arrayOf(number).isRequired,
    keymap: object.isRequired,

    tags: arrayOf(shape({
      id: number.isRequired,
      name: string.isRequired
    })).isRequired,

    onContextMenu: func.isRequired,
    onEditCancel: func.isRequired,
    onItemTagAdd: func.isRequired,
    onItemTagRemove: func.isRequired,
    onTagSave: func.isRequired
  }
}

module.exports = {
  TagPanel: connect(
    (state) => ({
      edit: state.edit.tabTag,
      items: state.nav.items,
      keymap: state.keymap.TagList,
      tags: getItemTags(state)
    })
  )(TagPanel)
}
