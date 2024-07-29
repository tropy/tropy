import React from 'react'
import { SelectionIterator } from './iterator.js'
import { SelectionListItem } from './list-item.js'
import cx from 'classnames'
import { dc } from '../../ontology/ns.js'


class SelectionList extends SelectionIterator {
  isEditing(selection) {
    return this.props.edit === selection
  }

  render() {
    return this.connect(
      <ul className={cx('selection-list', { over: this.props.isOver })}>
        {this.map(({ selection, ...props }) => (
          <SelectionListItem
            {...props}
            key={selection.id}
            data={this.props.data}
            isEditing={this.isEditing(selection.id)}
            selection={selection}
            title={dc.title}
            onChange={this.props.onChange}
            onContextMenu={this.props.onContextMenu}
            onEdit={this.props.onEdit}
            onEditCancel={this.props.onEditCancel}/>
        ))}
      </ul>
    )
  }
}

const SelectionListContainer = SelectionList.asDropTarget()

export {
  SelectionListContainer as SelectionList
}
