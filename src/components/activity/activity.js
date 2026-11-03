import { IconSpin, IconXSmall } from '../icons.js'
import { FormattedMessage } from 'react-intl'
import cx from 'classnames'
import { Button } from '../button.js'


export const Activity = ({
  id,
  type,
  progress,
  total,
  canCancel,
  onCancel
}) => {
  let hasProgressBar = (progress > 0)
  let hasCancelButton = canCancel && typeof onCancel === 'function'

  return (
    <div className={cx('activity', { type })}>
      <div className="activity-container">
        <div className="flex-row center">
          {!hasProgressBar && <IconSpin/>}
          <div className="activity-text">
            <FormattedMessage
              id={`activity.${type}`}
              values={{ progress: progress - 1, total, hasProgressBar }}/>
          </div>
          {hasCancelButton && (
            <Button
              icon={<IconXSmall/>}
              onClick={() => onCancel(id)}/>
          )}
        </div>
        {hasProgressBar && (
          <div className="flex-row center">
            <progress value={progress - 1} max={total}/>
          </div>
        )}
      </div>
    </div>
  )
}

export const CompletedActivity = ({
  type,
  count,
  errors,
  cancelled,
  isActive,
  onDismiss,
  onSelect
}) => (
  <div className={cx('activity', 'completed', { type, active: isActive })}>
    <div className="activity-container">
      <div className="flex-row center">
        <div
          className={cx('activity-text', { link: count > 0 })}
          onClick={count > 0 ? () => onSelect(type) : null}>
          <FormattedMessage
            id={`activity.completed.${type}`}
            values={{ count, errors, cancelled }}/>
        </div>
        <Button
          icon={<IconXSmall/>}
          onClick={() => onDismiss(type)}/>
      </div>
    </div>
  </div>
)

