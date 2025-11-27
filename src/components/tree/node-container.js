import cx from 'classnames'
import { Button } from '../button.js'
import { Icon } from '../icons.js'

export const NodeContainer = ({
  children,
  className,
  icon = 'Folder',
  isExpandable = false,
  onContextMenu,
  onClick,
  onExpand,
  ref
}) => {
  return (
    <div
      ref={ref}
      className={cx('node-container', className)}
      onContextMenu={onContextMenu}
      onClick={onClick}>
      {isExpandable && (
        <Button icon="IconTriangle" noFocus onClick={onExpand}/>
      )}
      <div className="icon-truncate">
        <Icon name={icon}/>
      </div>
      {children}
    </div>
  )
}
