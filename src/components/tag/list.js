'use strict'

const React = require('react')
const { PropTypes } = React
const { Tag } = require('./tag')
const { arrayOf, number, string, shape, object, func } = PropTypes


const TagList = ({ tags, edit, ...props }) => {

  if (edit && !edit.id) {
    var newTagEditable =
      <Tag {...props} tag={edit} isEditing/>
  }

  return (
    <ol className="tags">
      {
        tags.map(tag =>
          <Tag {...props}
            key={tag.id}
            tag={tag}
            isEditing={edit && edit.id === tag.id}/>)
      }
      {newTagEditable}
    </ol>
  )
}

TagList.propTypes = {
  tags: arrayOf(
    shape({
      id: number.isRequired,
      name: string.isRequired
    })
  ).isRequired,

  selection: arrayOf(number).isRequired,
  edit: object,

  onCancel: func.isRequired,
  onSelect: func.isRequired,
  onChange: func.isRequired,
  onContextMenu: func.isRequired
}


module.exports = {
  TagList
}
