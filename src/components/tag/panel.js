'use strict'

const React = require('react')
const { PureComponent } = React
const { arrayOf, func, number, object, shape, string } = require('prop-types')
const { connect } = require('react-redux')
const { TagList } = require('./list')
const { TagAdder } = require('./adder')
const { toId } = require('../../common/util')
const { seq, map, filter, compose } = require('transducers.js')
const { TABS } = require('../../constants')

const {
  getAllTags,
  getItemTags,
  getSelectedItems
} = require('../../selectors')


class TagPanel extends PureComponent {
  componentWillUnmount() {
    this.props.onBlur()
  }

  get isEmpty() {
    return this.props.items.length === 0
  }

  get tabIndex() {
    return this.isEmpty ? -1 : TABS.TagPanel
  }

  setContainer = (container) => {
    this.container = container
  }

  setAdder = (adder) => {
    this.adder = (adder == null) ? null : adder.getWrappedInstance()
  }

  focus = () => {
    this.container.focus()
  }

  handleCancel = (isForced) => {
    if (isForced) this.container.focus()
  }

  handleTagRemove = (tag) => {
    const present = seq(this.props.items,
      compose(filter(it => it.tags.includes(tag.id)), map(toId)))

    this.props.onItemTagRemove({ id: present, tags: [tag.id] })
  }

  handleTagAdd = (tag) => {
    if (tag.mixed !== false) {
      const missing = seq(this.props.items,
        compose(filter(it => !it.tags.includes(tag.id)), map(toId)))

      this.props.onItemTagAdd({ id: missing, tags: [tag.id] })
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

  handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      if (this.adder) {
        this.adder.focus()
        event.stopPropagation()
      }
    }
  }

  render() {
    return (
      <div
        ref={this.setContainer}
        className="tab-pane"
        tabIndex={this.tabIndex}
        onBlur={this.props.onBlur}
        onFocus={this.props.onFocus}
        onKeyDown={this.handleKeyDown}>
        <TagList
          edit={this.props.edit}
          keymap={this.props.keymap}
          tags={this.props.tags}
          hasFocusIcon
          onCommit={this.handleTagAdd}
          onEditCancel={this.props.onEditCancel}
          onRemove={this.handleTagRemove}
          onSave={this.props.onTagSave}
          onContextMenu={this.handleContextMenu}/>
        <TagAdder
          ref={this.setAdder}
          tags={this.props.allTags}
          count={this.props.items.length}
          onAdd={this.handleTagAdd}
          onCancel={this.handleCancel}
          onCreate={this.handleTagCreate}/>
      </div>
    )
  }

  static propTypes = {
    allTags: arrayOf(object).isRequired,
    edit: object,
    items: arrayOf(object).isRequired,
    keymap: object.isRequired,
    tags: arrayOf(shape({
      id: number.isRequired,
      name: string.isRequired
    })).isRequired,

    onBlur: func.isRequired,
    onFocus: func.isRequired,
    onContextMenu: func.isRequired,
    onEditCancel: func.isRequired,
    onItemTagAdd: func.isRequired,
    onItemTagRemove: func.isRequired,
    onTagCreate: func.isRequired,
    onTagSave: func.isRequired
  }
}

module.exports = {
  TagPanel: connect(
    (state) => ({
      allTags: getAllTags(state),
      edit: state.edit.tabTag,
      items: getSelectedItems(state),
      keymap: state.keymap.TagList,
      tags: getItemTags(state)
    })
  )(TagPanel)
}
