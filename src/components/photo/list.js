'use strict'

const React = require('react')
const { PropTypes } = React
const { PhotoListItem } = require('./list-item')
const { PhotoIterator } = require('./iterator')
const { DC } = require('../../constants/properties')
const { get } = require('../../common/util')
const cn = require('classnames')


class PhotoList extends PhotoIterator {

  get classes() {
    return {
      ...super.classes,
      'photo-list': true
    }
  }

  isEditing(photo) {
    return get(this.props.ui, 'edit.photo') === photo.id
  }

  render() {
    const { onChange, onEdit, onEditCancel } = this.props

    return this.connect(
      <ul
        className={cn(this.classes)}
        onClick={this.handleClickOutside}>
        {this.map(({ photo, ...props }) =>
          <PhotoListItem {...props}
            key={photo.id}
            photo={photo}
            title={DC.TITLE}
            isEditing={this.isEditing(photo)}
            onChange={onChange}
            onClick={this.handleClickInside}
            onEdit={onEdit}
            onEditCancel={onEditCancel}/>)}
      </ul>
    )
  }


  static propTypes = {
    ...PhotoIterator.propTypes,

    onChange: PropTypes.func,
    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func
  }
}


module.exports = {
  PhotoList: PhotoList.wrap()
}
