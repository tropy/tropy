import React from 'react'
import { SelectionIterator } from './iterator'
import { SelectionListItem } from './list-item'
import cx from 'classnames'
import { func, number, object } from 'prop-types'
import { SASS } from '../../constants'
import { dc } from '../../ontology'


class SelectionList extends SelectionIterator {
  get classes() {
    return ['selection-list', super.classes]
  }

  getColumns() {
    return 1
  }

  getRowHeight() {
    return SASS.ROW.HEIGHT
  }

  isEditing(selection) {
    return this.props.edit === selection
  }

  render() {
    return this.connect(
      <ul className={cx(this.classes)}>
        {this.map(({ selection, ...props }) =>
          <SelectionListItem {...props}
            key={selection.id}
            data={this.props.data}
            isEditing={this.isEditing(selection.id)}
            selection={selection}
            title={dc.title}
            onChange={this.props.onChange}
            onContextMenu={this.props.onContextMenu}
            onEdit={this.props.onEdit}
            onEditCancel={this.props.onEditCancel}/>)}
      </ul>
    )
  }

  static propTypes = {
    ...SelectionIterator.propTypes,
    edit: number,
    data: object.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired
  }
}

const SelectionListContainer = SelectionList.asDropTarget()

export {
  SelectionListContainer as SelectionList
}
