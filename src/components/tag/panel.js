'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { TagList } = require('./list')
const { TagAdder } = require('./adder')
const { toId } = require('../../common/util')
const {
  arrayOf, bool, func, number, object, shape, string
} = require('prop-types')

const {
  getAllTags,
  getItemTags,
  getSelectedItems,
  getTagCompletions
} = require('../../selectors')


class TagPanel extends React.PureComponent {
  getTaggedIds(tag, invert = false) {
    return this.props.items.reduce((ids, item) => {
      if (item.tags.includes(tag.id) !== invert) {
        ids.push(item.id)
      }

      return ids
    }, [])
  }

  setAdder = (adder) => {
    this.adder = (adder == null) ? null : adder.getWrappedInstance()
  }

  next = () => {
    this.adder.focus()
  }

  prev = () => {
    this.next()
  }

  handleTabFocus = () => {
    if (this.props.onTabFocus) {
      this.props.onTabFocus()
    }
  }

  handleTagRemove = (tag) => {
    const id = this.getTaggedIds(tag)

    if (id.length > 0) {
      this.props.onItemTagRemove({ id, tags: [tag.id] })
    }
  }

  handleTagAdd = (tag) => {
    const id = this.getTaggedIds(tag, true)

    if (id.length > 0) {
      this.props.onItemTagAdd({ id, tags: [tag.id] })
    }
  }

  handleTagCreate = (tag) => {
    this.props.onTagCreate({ ...tag, items: this.props.items.map(toId) })
  }

  handleContextMenu = (event, tag) => {
    this.props.onContextMenu(event, 'item-tag', {
      id: tag.id,
      color: tag.color,
      mixed: tag.mixed,
      items: this.props.items.map(toId)
    })
  }

  render() {
    return (
      <div className="tag-panel">
        <TagList
          keymap={this.props.keymap}
          tags={this.props.tags}
          hasFocusIcon
          onRemove={this.handleTagRemove}
          onContextMenu={this.handleContextMenu}/>
        <TagAdder
          ref={this.setAdder}
          isDisabled={this.props.isDisabled}
          completions={this.props.completions}
          count={this.props.items.length}
          tags={this.props.allTags}
          onAdd={this.handleTagAdd}
          onBlur={this.props.onBlur}
          onCreate={this.handleTagCreate}/>
      </div>
    )
  }

  static propTypes = {
    allTags: arrayOf(object).isRequired,
    completions: arrayOf(string).isRequired,
    edit: object,
    isDisabled: bool,
    items: arrayOf(object).isRequired,
    keymap: object.isRequired,
    tags: arrayOf(shape({
      id: number.isRequired,
      name: string.isRequired
    })).isRequired,

    onBlur: func,
    onTabFocus: func,
    onContextMenu: func.isRequired,
    onItemTagAdd: func.isRequired,
    onItemTagRemove: func.isRequired,
    onTagCreate: func.isRequired
  }
}

module.exports = {
  TagPanel: connect(
    (state) => ({
      allTags: getAllTags(state),
      completions: getTagCompletions(state),
      edit: state.edit.tabTag,
      items: getSelectedItems(state),
      keymap: state.keymap.TagList,
      tags: getItemTags(state)
    }), null, null, { forwardRef: true }
  )(TagPanel)
}
