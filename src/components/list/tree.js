'use strict'

const React = require('react')
const lazy = require('./node')
const { Fade } = require('../fx')
const { get } = require('../../common/util')
const { arrayOf, bool, func, number, object, shape } = require('prop-types')


class ListTree extends React.Component {
  hasNewListNode(parent = this.props.parent.id) {
    let { edit } = this.props
    return edit && edit.id == null && edit.parent === parent
  }

  isEditing(id) {
    return get(this.props.edit, ['id']) === id
  }

  mapChildren(fn, props = this.props) {
    return props.parent.children.map((id, idx, all) => {
      if (id in props.lists) {
        let list = props.lists[id]
        let hasNewListNode = this.hasNewListNode(id)
        let isExpandable = hasNewListNode || list.children.length > 0
        let isExpanded = hasNewListNode || props.expand[id]
        let isLast = (idx === all.length - 1)

        return fn(id, {
          ...props,
          list,
          isSelected: props.selection === id,
          isExpandable,
          isExpanded: isExpandable && isExpanded,
          isEditing: this.isEditing(id),
          isHolding: props.hold[id],
          isLast,
          position: idx
        })
      }
    })
  }

  render() {
    return (
      <ol className="list-tree" ref={this.setContainer}>
        {this.mapChildren((key, props) =>
          <lazy.ListNode key={key} {...props}/>)}
        <Fade in={this.hasNewListNode()} exit={false}>
          <lazy.NewListNode
            parent={get(this.props.edit, ['parent'])}
            onCancel={this.props.onEditCancel}
            onSave={this.props.onSave}/>
        </Fade>
      </ol>
    )
  }

  static propTypes = {
    depth: number.isRequired,
    edit: object,
    expand: object.isRequired,
    hold: object.isRequired,
    isDraggingParent: bool,
    isExpanded: bool,
    lists: object.isRequired,
    minDropDepth: number.isRequired,
    parent: shape({
      id: number.isRequired,
      children: arrayOf(number).isRequired
    }).isRequired,
    selection: number,
    onEditCancel: func.isRequired,
    onSave: func.isRequired
  }

  static defaultProps = {
    depth: 0,
    minDropDepth: 0
  }
}

module.exports.ListTree = ListTree
