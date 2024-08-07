import React from 'react'
import { connect } from 'react-redux'
import { TagList } from './list.js'
import { TagAdder } from './adder.js'
import { toId } from '../../common/util.js'
import * as act from '../../actions/index.js'

import {
  getAllTags,
  getItemTags,
  getSelectedItems,
  getTagCompletions
} from '../../selectors/index.js'


class TagPanel extends React.PureComponent {
  adder = React.createRef()

  getTaggedIds(tag, invert = false) {
    return this.props.items.reduce((ids, item) => {
      if (item.tags.includes(tag.id) !== invert) {
        ids.push(item.id)
      }

      return ids
    }, [])
  }

  next = () => {
    this.adder.current.focus()
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
    let id = this.getTaggedIds(tag)
    if (id.length > 0) {
      this.props.onItemTagRemove({ id, tags: [tag.id] })
    }
  }

  handleTagAdd = (tag) => {
    let id = this.getTaggedIds(tag, true)
    if (id.length > 0) {
      this.props.onItemTagAdd({ id, tags: [tag.id] })
    }
  }

  handleTagCreate = (tag) => {
    this.props.onTagCreate({ ...tag, items: this.props.items.map(toId) })
  }

  handleContextMenu = (event, _, target) => {
    this.props.onContextMenu(event, 'item-tag', {
      ...target,
      items: this.props.items.map(toId)
    })
  }

  render() {
    return (
      <>
        <TagList
          keymap={this.props.keymap}
          tags={this.props.tags}
          hasFocusIcon
          isReadOnly={this.props.isDisabled}
          onCommit={this.handleTagAdd}
          onContextMenu={this.handleContextMenu}
          onRemove={this.handleTagRemove}/>
        <TagAdder
          ref={this.adder}
          isDisabled={this.props.isDisabled}
          completions={this.props.completions}
          count={this.props.items.length}
          tags={this.props.allTags}
          onAdd={this.handleTagAdd}
          onBlur={this.props.onBlur}
          onCancel={this.props.onCancel}
          onCreate={this.handleTagCreate}/>
      </>
    )
  }
}

const TagPanelContainer = connect(
  (state) => ({
    allTags: getAllTags(state),
    completions: getTagCompletions(state),
    edit: state.edit.tabTag,
    items: getSelectedItems(state),
    keymap: state.keymap.TagList,
    tags: getItemTags(state)
  }),

  (dispatch) => ({
    onTagCreate(data) {
      dispatch(act.tag.create(data))
    },

    onItemTagAdd(...args) {
      dispatch(act.item.tags.create(...args))
    },

    onItemTagRemove(...args) {
      dispatch(act.item.tags.delete(...args))
    }
  }), null, { forwardRef: true }
)(TagPanel)

export {
  TagPanelContainer as TagPanel
}
