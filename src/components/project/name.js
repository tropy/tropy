import cx from 'classnames'
import { bool, func, string } from 'prop-types'
import { DND, useDrop, getDroppedFiles, hasPhotoFiles } from '../dnd.js'
import { IconMaze, IconWarningSm, IconLock } from '../icons.js'
import { Editable } from '../editable.js'


export function ProjectName(props) {

  let [{ canDrop, isOver }, drop] = useDrop({
    accept: [DND.FILE, DND.URL],

    drop(item) {
      let photos = getDroppedFiles(item)

      if (photos) {
        props.onDrop(photos)
        return photos
      }
    },

    canDrop(item, monitor) {
      if (props.isReadOnly)
        return false

      switch (monitor.getItemType()) {
        case DND.FILE:
          return hasPhotoFiles(item)
        case DND.URL:
          return true
      }
    },

    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  })

  return (
    <li
      ref={drop}
      className={cx('project-name', {
        'active': props.isSelected,
        'read-only': props.isReadOnly,
        'over': isOver && canDrop
      })}
      onClick={props.onClick}>
      <div className="list-node-container">
        <IconMaze/>
        <div className="name">
          <Editable
            value={props.name}
            isDisabled={props.isReadOnly}
            isRequired
            resize
            isActive={props.isEditing}
            onCancel={props.onEditCancel}
            onChange={props.onChange}/>
        </div>
        {props.isCorrupted &&
          <IconWarningSm title="project.corrupted"/>}
        {props.isReadOnly &&
          <IconLock title="project.readOnly"/>}
      </div>
    </li>
  )
}


ProjectName.propTypes = {
  isCorrupted: bool,
  isEditing: bool,
  isReadOnly: bool,
  isSelected: bool,
  name: string.isRequired,
  onChange: func.isRequired,
  onClick: func.isRequired,
  onDrop: func.isRequired,
  onEditCancel: func.isRequired
}
