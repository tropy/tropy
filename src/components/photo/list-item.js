'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { Editable } = require('../editable')
const { noop } = require('../../common/util')
const { imageURL } = require('../../common/cache')
const { getCachePrefix } = require('../../selectors/project')
const act = require('../../actions')
const cn = require('classnames')


class PhotoListItem extends Component {

  select = () => {
    const { photo, onPhotoSelection, isSelected } = this.props
    onPhotoSelection(isSelected ? null : photo.id)
  }

  popup = (event) => {
    if (!this.props.isDisabled) {
      this.props.showPhotoMenu(event, this.props.photo)
    }
  }


  render() {
    const {
      photo, cache, data, title, isSelected, context, ...props
    } = this.props

    delete props.onPhotoSelection
    delete props.showPhotoMenu

    return (
      <li
        className={cn({ photo: true, active: isSelected, context })}
        onClick={this.select}
        onContextMenu={this.popup}>

        <Thumbnail src={imageURL(cache, photo.id, 48)} size={24}/>

        <div className="title">
          <Editable {...props} value={data[title] && data[title].value}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,

    isDisabled: PropTypes.bool,
    isEditing: PropTypes.bool,
    isSelected: PropTypes.bool,

    cache: PropTypes.string,
    data: PropTypes.object,

    photo: PropTypes.shape({
      id: PropTypes.number.isRequired
    }).isRequired,

    context: PropTypes.bool,

    onEditableCancel: PropTypes.func,
    onEditableChange: PropTypes.func,

    showPhotoMenu: PropTypes.func,
    onPhotoSelection: PropTypes.func
  }

  static defaultProps = {
    onPhotoSelection: noop
  }
}

const Thumbnail = ({ src, size }) => (
  <img
    className="thumbnail"
    srcSet={`${encodeURI(src)} 2x`}
    width={size}
    height={size}/>
)

Thumbnail.propTypes = {
  src: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired
}


module.exports = {
  PhotoListItem: connect(
    (state, { id }) => ({
      data: state.metadata[id] || {},
      photo: state.photos[id] || { id },
      isEditing: state.ui.edit.photo === id,
      context: state.ui.context.photo === id,
      cache: getCachePrefix(state)
    }),

    (dispatch, { id, title }) => ({

      onEditableChange(value) {
        dispatch(act.metadata.save({
          id,
          data: {
            [title]: { value, type: 'text' }
          }
        }))
        dispatch(act.ui.edit.cancel())
      },

      onEditableCancel() {
        dispatch(act.ui.edit.cancel())
      }
    })

  )(PhotoListItem)
}
