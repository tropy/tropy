import { FormattedMessage } from 'react-intl'
import cx from 'classnames'
import { Button } from '../button.js'
import { Icon } from '../icons.js'


export const Activity = ({
  id,
  type,
  status,
  progress,
  total,
  count,
  errors,
  canCancel,
  hasItems,
  isActive,
  onCancel,
  onDismiss,
  onSelect
}) => {
  let isBusy = (status === 'busy')
  let hasProgressBar = isBusy && progress > 0

  return (
    <div
      className={cx('activity', status, {
        active: isActive,
        link: hasItems
      })}
      onClick={hasItems
        ? () => onSelect(type, isBusy ? id : null)
        : null
      }>
      <div className="activity-container">
        <div className="flex-row center">
          {isBusy && !hasProgressBar && <Icon name="Spin"/>}
          <ActivityText
            type={type}
            isBusy={isBusy}
            values={isBusy ?
              { progress: progress - 1, total, hasProgressBar } :
              { count, errors }}/>
          {isBusy ? canCancel && (
            <ActivityAction
              icon="XCircleSmall"
              onClick={() => onCancel(id)}/>
          ) : (
            <ActivityAction
              icon="CheckmarkCircleSmall"
              onClick={() => onDismiss(type)}/>
          )}
        </div>
        {hasProgressBar && (
          <ActivityProgress progress={progress} total={total}/>
        )}
      </div>
    </div>
  )
}

const ActivityText = ({ type, isBusy, values }) => (
  <div className="activity-text">
    <FormattedMessage
      id={isBusy ? `activity.${type}` : `activity.completed.${type}`}
      values={values}/>
  </div>
)

const ActivityAction = ({ icon, onClick }) => (
  <Button
    icon={icon}
    noFocus
    onClick={(event) => {
      event.stopPropagation()
      onClick()
    }}/>
)

const ActivityProgress = ({ progress, total }) => (
  <div className="flex-row center">
    <progress value={progress - 1} max={total}/>
  </div>
)
