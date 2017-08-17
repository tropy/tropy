'use strict'


const React = require('react')
const { SelectionIterable } = require('./iterable')
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const cx = require('classnames')
const { get } = require('../../common/util')
const { bool, func, object, string } = require('prop-types')


class SelectionListItem extends SelectionIterable {

  get title() {
    const { data, selection, title } = this.props
    return get(data, [selection.id, title, 'text'])
  }

  handleClick = createClickHandler({
    onClick: () => {
      const { isActive } = this.props
      this.select()
      return !isActive
    },

    onSingleClick: () => {
      if (!(this.props.isDisabled || this.props.isDragging)) {
        this.props.onEdit(this.props.selection.id)
      }
    },

    onDoubleClick: this.open
  })

  handleChange = (text) => {
    const { selection, title, onChange } = this.props

    onChange({
      id: selection.id,
      data: {
        [title]: { text, type: 'text' }
      }
    })
  }

  render() {
    const { title } = this

    return (
      <li
        className={cx(this.classes)}
        ref={this.setContainer}
        onClick={this.handleClick}>
        {this.renderThumbnail()}
        <div className="title">
          <Editable
            display={title || 'Selection'}
            value={title}
            isEditing={this.props.isEditing}
            isDisabled={this.props.isDisabled}
            onCancel={this.props.onEditCancel}
            onChange={this.handleChange}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    ...SelectionIterable.propTypes,
    title: string.isRequired,
    data: object.isRequired,
    isEditing: bool.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired
  }
}

module.exports = {
  SelectionListItem
}
