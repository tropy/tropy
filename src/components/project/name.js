import cx from 'classnames'
import { bool, func, string } from 'prop-types'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { IconMaze, IconWarningSm, IconLock } from '../icons.js'
import { Editable } from '../editable.js'


export function ProjectName(props) {
  let [{ canDrop, isOver }, drop] = useDropPhotoFiles(props)

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
