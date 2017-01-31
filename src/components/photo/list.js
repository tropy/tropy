'use strict'

const React = require('react')
const { PropTypes } = React
const { PhotoListItem } = require('./list-item')
const { PhotoIterator } = require('./iterator')
const { DC } = require('../../constants/properties')
const { get } = require('../../common/util')


class PhotoList extends PhotoIterator {

  isEditing(photo) {
    return get(this.props.ui, 'edit.photo') === photo.id
  }

  render() {
    const { onEdit, onEditCancel } = this.props

    return (
      <ul className="photo-list">
        {this.map(props =>
          <PhotoListItem {...props}
            key={props.photo.id}
            title={DC.TITLE}
            isEditing={this.isEditing(props.photo)}
            onClick={this.select}
            onSingleClick={onEdit}
            onDoubleClick={this.open}
            onEditCancel={onEditCancel}/>
        )}
      </ul>
    )
  }

  static propTypes = {
    ...PhotoIterator.propTypes,

    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func
  }
}

module.exports = {
  PhotoList
}
