'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { Editable } = require('../editable')
const { imageURL } = require('../../common/cache')
const { getCachePrefix } = require('../../selectors/project')
const act = require('../../actions')
const cn = require('classnames')


class PhotoListItem extends Component {

  handleClick = (event) => {
    if (!this.props.isDisabled) {
      this.props.onSelect(this.props.photo, event)
    }
  }

  handleContextMenu = (event) => {
    if (!this.props.isDisabled) {
      this.props.onContextMenu(this.props.photo, event)
    }
  }


  render() {
    const {
      photo, cache, data, title, isSelected, context, ...props
    } = this.props

    delete props.onSelect
    delete props.onContextMenu

    return (
      <li
        className={cn({ photo: true, active: isSelected, context })}
        onClick={this.handleClick}
        onContextMenu={this.handleContextMenu}>

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

    onCancel: PropTypes.func,
    onChange: PropTypes.func,

    onContextMenu: PropTypes.func,
    onSelect: PropTypes.func
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

      onChange(value) {
        dispatch(act.metadata.save({
          id,
          data: {
            [title]: { value, type: 'text' }
          }
        }))
        dispatch(act.ui.edit.cancel())
      },

      onCancel() {
        dispatch(act.ui.edit.cancel())
      }
    })

  )(PhotoListItem)
}
