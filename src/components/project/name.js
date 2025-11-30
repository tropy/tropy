import cx from 'classnames'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { NodeContainer } from '../tree/node-container.js'
import { Icon } from '../icons.js'
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
      <NodeContainer icon="Maze">
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
          <Icon name="WarningSm" title="project.corrupted"/>}
        {props.isReadOnly &&
          <Icon name="Lock" title="project.readOnly"/>}
      </NodeContainer>
    </li>
  )
}
