'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { Tag } = require('./tag')
const actions = require('../../actions')


const TagList = ({ tags, editing, ...props }) => {

  if (editing && !editing.id) {
    var newTagEditable =
      <Tag {...props} tag={editing} isEditing/>
  }

  return (
    <ol className="tags">
      {
        tags.map(tag =>
          <Tag {...props}
            key={tag.id}
            tag={tag}
            isEditing={editing && editing.id === tag.id}/>)
      }
      {newTagEditable}
    </ol>
  )
}

TagList.propTypes = {
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,

  selection: PropTypes.arrayOf(PropTypes.number).isRequired,
  editing: PropTypes.object,

  onCancel: PropTypes.func,
  onSelect: PropTypes.func,
  onChange: PropTypes.func,
  onContextMenu: PropTypes.func
}


module.exports = {
  TagList: connect(
    (state) => ({
      selection: state.nav.tags,
      editing: state.ui.edit.tag,
    }),

    (dispatch) => ({
      onCancel() {
        dispatch(actions.ui.edit.cancel())
      },

      onSelect(id, mod) {
        dispatch(actions.tag.select(id, { mod }))
      },

      onChange(id, values) {
        dispatch(actions.ui.edit.cancel())
        dispatch(id ?
          actions.tag.save({ id, ...values }) :
          actions.tag.create({ ...values }))
      }
    })
  )(TagList)
}
