'use strict'

const React = require('react')
const { SelectionIterator } = require('./iterator')
const { SelectionListItem } = require('./list-item')
const cx = require('classnames')
const { func, number, object } = require('prop-types')
const { DC } = require('../../constants')


class SelectionList extends SelectionIterator {
  get classes() {
    return {
      ...super.classes,
      list: true
    }
  }

  isEditing(selection) {
    return this.props.edit === selection
  }

  handleEditCancel = (...args) => {
    this.props.onEditCancel(...args)
    this.container.focus()
  }

  render() {
    return (
      <ul className={cx(this.classes)}>
        {this.map(({ selection, ...props }) =>
          <SelectionListItem {...props}
            key={selection.id}
            data={this.props.data}
            isEditing={this.isEditing(selection.id)}
            selection={selection}
            title={DC.title}
            onChange={this.props.onChange}
            onEdit={this.props.onEdit}
            onEditCancel={this.handleEditCancel}/>)}
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

module.exports = {
  SelectionList
}
