'use strict'

const React = require('react')
const { SelectionIterator } = require('./iterator')
const { SelectionListItem } = require('./list-item')
const { on, off } = require('../../dom')
const cx = require('classnames')
const { func, number, object } = require('prop-types')
const { DC, SASS: { ROW } } = require('../../constants')


class SelectionList extends SelectionIterator {
  componentDidMount() {
    on(this.container, 'tab:focus', this.handleFocus)
  }

  componentWillUnmount() {
    off(this.container, 'tab:focus', this.handleFocus)
  }

  componentWillReceiveProps() {
  }

  get classes() {
    return ['list', super.classes]
  }

  getColumns() {
    return 1
  }

  getRowHeight() {
    return ROW.HEIGHT
  }


  isEditing(selection) {
    return this.props.edit === selection
  }

  handleEditCancel = (...args) => {
    this.props.onEditCancel(...args)
    this.container.focus()
  }

  render() {
    return this.connect(
      <ul
        className={cx(this.classes)}
        ref={this.setContainer}>
        {this.map(({ selection, ...props }) =>
          <SelectionListItem {...props}
            key={selection.id}
            data={this.props.data}
            isEditing={this.isEditing(selection.id)}
            selection={selection}
            title={DC.title}
            onChange={this.props.onChange}
            onContextMenu={this.props.onContextMenu}
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
  SelectionList: SelectionList.asDropTarget()
}
