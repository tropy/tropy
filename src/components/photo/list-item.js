'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { Editable } = require('../editable')
const { noop } = require('../../common/util')
const act = require('../../actions')
const cn = require('classnames')


class ListItem extends Component {
  constructor(props) {
    super(props)
  }

  update = (title) => {
    this.props.onUpdate(this.props.photo.id, {
      [this.props.title]: title
    })
  }

  render() {
    const {
      data, title, selected, context, onContextMenu,
      onRename, onSelect, ...editable
    } = this.props

    return (
      <li
        className={cn({ photo: true, active: selected, context })}
        onClick={onSelect}
        onContextMenu={this.props.disabled ? noop : onContextMenu}>
        <img src="dev/dummy-24-2x.jpg"
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
    data: PropTypes.object,
    title: PropTypes.string,
    editing: PropTypes.bool,
    disabled: PropTypes.bool,
    selected: PropTypes.bool,
    context: PropTypes.bool,
    onContextMenu: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func,
    onUpdate: PropTypes.func,
    onRename: PropTypes.func,
    onSelect: PropTypes.func
  }

  static defaultProps = {
    title: 'title'
  }
}


module.exports = {
  ListItem: connect(
    (state, { photo }) => ({
      data: state.metadata[photo.id] || {},
      selected: state.nav.photo === photo.id,
      editing: state.ui.edit.photo === photo.id,
      context: state.ui.context.photo === photo.id
    }),

    (dispatch, { photo, selected, title }) => ({

      onRename() {
        dispatch(act.ui.edit.start({ photo: photo.id }))
      },

      onChange(value) {
        dispatch(act.metadata.save({
          id: photo.id,
          data: {
            [title || 'title']: { value, type: 'text' }
          }
        }))
        dispatch(act.ui.edit.cancel())
      },

      onCancel() {
        dispatch(act.ui.edit.cancel())
      },

      onSelect() {
        dispatch(act.photo.select(selected ? null : photo.id))
      },

      onContextMenu(event) {
        event.stopPropagation()
        dispatch(act.ui.context.show(event, 'photo', {
          id: photo.id,
          item: photo.item,
          file: photo.path
        }))
      }
    })

  )(ListItem)
}
