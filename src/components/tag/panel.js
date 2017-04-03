'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { arrayOf, func, number, object, shape, string } = PropTypes
const { connect } = require('react-redux')
const { getItemTags } = require('../../selectors')
const { TagList } = require('./list')


class TagPanel extends PureComponent {

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
          tags={this.props.tags}
          onEditCancel={this.props.onEditCancel}
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

    tags: arrayOf(shape({
      id: number.isRequired,
      name: string.isRequired
    })).isRequired,

    onContextMenu: func.isRequired,
    onEditCancel: func.isRequired,
    onTagSave: func.isRequired
  }
}

module.exports = {
  TagPanel: connect(
    (state) => ({
      edit: state.edit.tabTag,
      items: state.nav.items,
      tags: getItemTags(state)
    })
  )(TagPanel)
}
