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
  isCancelled,
  canCancel,
  hasItems,
  isSelected,
  onCancel,
  onDismiss,
  onSelect
}) => {
  let isBusy = (status === 'busy')
  let hasProgressBar = isBusy && progress > 0
  let numCompleted = progress - 1

  let button, message, values

  if (isBusy) {
    if (canCancel)
      button = <CancelButton onClick={() => onCancel(id)}/>

    message = `activity.${type}`
    values = { progress: numCompleted, total, hasProgressBar }
  } else {
    button = <DismissButton onClick={() => onDismiss(type, id)}/>

    message = `activity.past.${type}`
    values = { count, errors, cancelled: String(!!isCancelled) }
  }

  return (
    <div
      className={cx('activity', status, {
        active: isSelected,
        link: hasItems
      })}
      onClick={hasItems
        ? () => onSelect(type, id)
        : null
      }>
      {hasProgressBar && (
        <progress value={numCompleted} max={total}/>
      )}
      <div className="activity-container">
        <div className="flex-row center">
          {isBusy && !hasProgressBar && <Icon name="Spin"/>}
          <div className="activity-text">
            <FormattedMessage id={message} values={values}/>
          </div>
          {button}
        </div>
      </div>
    </div>
  )
}

const CancelButton = ({ onClick }) => (
  <Button
    icon="XCircleSmall"
    noFocus
    title="activity.cancel"
    onClick={onClick}/>
)

const DismissButton = ({ onClick }) => (
  <Button
    icon="CheckmarkCircleSmall"
    noFocus
    title="activity.dismiss"
    onClick={onClick}/>
)
