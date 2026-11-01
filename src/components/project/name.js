import cx from 'classnames'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { NodeContainer } from '../tree/node-container.js'
import { FormattedIcon, IconMaze } from '../icons.js'
import { Editable } from '../editable.js'


export function ProjectName (props) {
  let [{ canDrop, isOver }, drop] = useDropPhotoFiles({
    onDrop: props.onDrop,
    isDisabled: props.isReadOnly
  })

  return (
    <li
      ref={drop}
      className={cx('project-name', {
        active: props.isSelected,
        'read-only': props.isReadOnly,
        over: isOver && canDrop
      })}
      onClick={props.onClick}>
      <NodeContainer icon={<IconMaze seed={props.id}/>}>
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
        {props.warnings?.length > 0 &&
          <FormattedIcon name="WarningSm" title={`project.${props.warnings[0]}`}/>}
        {props.isReadOnly &&
          <FormattedIcon name="Lock" title="project.readOnly"/>}
      </NodeContainer>
    </li>
  )
}
