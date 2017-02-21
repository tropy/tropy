'use strict'

const React = require('react')
const { PropTypes } = React
const { PhotoListItem } = require('./list-item')
const { PhotoIterator } = require('./iterator')
const { DC } = require('../../constants/properties')
const { get } = require('../../common/util')
const { on, off } = require('../../dom')
const cx = require('classnames')


class PhotoList extends PhotoIterator {
  componentDidMount() {
    on(this.container, 'tab:focus', this.handleFocus)
  }

  componentWillUnmount() {
    off(this.container, 'tab:focus', this.handleFocus)
  }

  get classes() {
    return {
      ...super.classes,
      'photo-list': true,
      'click-catcher': true
    }
  }

  isEditing(photo) {
    return get(this.props.ui, 'edit.photo') === photo.id
  }

  render() {
    const { data, onChange, onEdit, onEditCancel } = this.props

    return this.connect(
      <ul
        className={cx(this.classes)}
        ref={this.setContainer}
        tabIndex={this.tabIndex}
        onKeyDown={this.handleKeyDown}
        onClick={this.handleClickOutside}>
        {this.map(({ photo, ...props }) =>
          <PhotoListItem {...props}
            key={photo.id}
            photo={photo}
            data={data[photo.id]}
            title={DC.TITLE}
            isEditing={this.isEditing(photo)}
            onChange={onChange}
            onEdit={onEdit}
            onEditCancel={onEditCancel}/>)}
      </ul>
    )
  }


  static propTypes = {
    ...PhotoIterator.propTypes,
    data: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onEditCancel: PropTypes.func.isRequired
  }
}


module.exports = {
  PhotoList: PhotoList.wrap()
}
