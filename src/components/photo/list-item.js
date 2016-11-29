'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { Editable } = require('../editable')
const { noop } = require('../../common/util')
const { imageURL } = require('../../common/cache')
const { DC } = require('../../constants/properties')
const { getCachePrefix } = require('../../selectors/project')
const act = require('../../actions')
const cn = require('classnames')

// TODO move connect logic to list

class PhotoListItem extends Component {
  constructor(props) {
    super(props)
  }

  update = (title) => {
    this.props.onUpdate(this.props.photo.id, {
      [this.props.title]: title
    })
  }

  select = () => {
    const { photo, handlePhotoSelect, isSelected } = this.props
    handlePhotoSelect(isSelected ? null : photo.id)
  }

  popup = (event) => {
    if (!this.props.isDisabled) {
      this.props.showPhotoMenu(event, this.props.photo)
    }
  }

  render() {
    const {
      photo, cache, data, title, isSelected, context,
      showPhotoMenu, onRename, ...editable
    } = this.props

    const src = imageURL(cache, photo.id, 48)

    return (
      <li
        className={cn({ photo: true, active: isSelected, context })}
        onClick={this.select}
        onContextMenu={this.popup}>
        <img srcSet={`${encodeURI(src)} 2x`}
          width={24} height={24} className="thumbnail"/>
        <div className="title">
          <Editable {...editable}
            value={data[title] && data[title].value}
            onActivate={onRename}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    photo: PropTypes.shape({
      id: PropTypes.number.isRequired
    }).isRequired,
    cache: PropTypes.string,
    data: PropTypes.object,
    title: PropTypes.string,
    editing: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isSelected: PropTypes.bool,
    context: PropTypes.bool,
    showPhotoMenu: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func,
    onUpdate: PropTypes.func,
    onRename: PropTypes.func,
    handlePhotoSelect: PropTypes.func
  }

  static defaultProps = {
    title: DC.TITLE,
    handlePhotoSelect: noop
  }
}


module.exports = {
  PhotoListItem: connect(
    (state, { photo }) => ({
      data: state.metadata[photo.id] || {},
      selected: state.nav.photo === photo.id,
      editing: state.ui.edit.photo === photo.id,
      context: state.ui.context.photo === photo.id,
      cache: getCachePrefix(state)
    }),

    (dispatch, { photo, selected, title }) => ({

      onRename() {
        dispatch(act.ui.edit.start({ photo: photo.id }))
      },

      onChange(value) {
        dispatch(act.metadata.save({
          id: photo.id,
          data: {
            [title || DC.TITLE]: { value, type: 'text' }
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
