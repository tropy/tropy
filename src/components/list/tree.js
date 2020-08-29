import React from 'react'
import { ListNode, NewListNode } from './node'
import { Fade } from '../fx'
import { arrayOf, bool, func, number, object, shape } from 'prop-types'


export class ListTree extends React.Component {
  hasNewListNode(parent = this.props.parent.id) {
    let { edit } = this.props
    return edit && edit.id == null && edit.parent === parent
  }

  isEditing(id) {
    return this.props.edit?.id === id
  }

  mapChildren(fn, props = this.props) {
    return props.isExpanded && props.parent.children.map((id, idx, all) => {
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
          <ListNode key={key} {...props}/>)}
        <Fade in={this.hasNewListNode()} exit={false}>
          <NewListNode
            parent={this.props.edit?.parent}
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
    expand: {},
    hold: {},
    lists: {},
    minDropDepth: 0
  }
}
