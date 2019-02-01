'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { TagList } = require('./list')
const { TagAdder } = require('./adder')
const { toId } = require('../../common/util')
const { TABS } = require('../../constants')
const { match } = require('../../keymap')
const { on, off } = require('../../dom')
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
  container = React.createRef()

  componentDidMount() {
    if (this.container.current) {
      on(this.container.current, 'tab:focus', this.handleTabFocus)
    }
  }

  componentWillUnmount() {
    if (this.props.onBlur) {
      this.props.onBlur()
    }

    if (this.container.current) {
      off(this.container.current, 'tab:focus', this.handleTabFocus)
    }
  }

  get isEmpty() {
    return this.props.items.length === 0
  }

  get tabIndex() {
    return this.isEmpty ? -1 : TABS.TagPanel
  }

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

  focus = () => {
    this.container.current.focus()
  }

  handleCancel = (hasChanged) => {
    if (!hasChanged) this.container.current.focus()
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

  handleKeyDown = (event) => {
    switch (match(this.props.keymap, event)) {
      case 'down':
      case 'commit':
        this.adder.focus()
        break
      default:
        return
    }

    event.stopPropagation()
    event.preventDefault()
    event.nativeEvent.stopImmediatePropagation()
  }

  render() {
    return (
      <div
        ref={this.container}
        className="tag-panel"
        tabIndex={this.tabIndex}
        onBlur={this.props.onBlur}
        onKeyDown={this.handleKeyDown}>
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
          onCancel={this.handleCancel}
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
    })
  )(TagPanel)
}
