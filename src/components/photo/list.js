'use strict'

const React = require('react')
const { PropTypes } = require('prop-types')
const { number, object, func } = PropTypes
const { PhotoListItem } = require('./list-item')
const { PhotoIterator } = require('./iterator')
const { DC } = require('../../constants/properties')
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
      'photo': true,
      'list': true,
      'click-catcher': true
    }
  }

  isEditing(photo) {
    return this.props.edit === photo.id
  }

  handleEditCancel = (...args) => {
    this.props.onEditCancel(...args)
    this.container.focus()
  }


  render() {
    const { data, onChange, onEdit } = this.props

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
            onEditCancel={this.handleEditCancel}/>)}
      </ul>
    )
  }

  static propTypes = {
    ...PhotoIterator.propTypes,
    edit: number,
    data: object.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired
  }
}


module.exports = {
  PhotoList: PhotoList.wrap()
}
