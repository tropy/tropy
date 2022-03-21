import React from 'react'
import { isFunction } from 'util'
import { IconSpin, IconXSmall } from './icons'
import { FormattedMessage } from 'react-intl'
import cx from 'classnames'
import { SASS } from '../constants'
import { arrayOf, bool, shape, string, number, func } from 'prop-types'
import { Button } from './button'


export const Activity = ({
  id,
  type,
  progress,
  total,
  canCancel,
  onCancel
}) => {
  let hasProgressBar = (progress > 0)
  let hasCancelButton = canCancel && isFunction(onCancel)

  return (
    <div className={cx('activity', { type })}>
      <div className="activity-container">
        <div className="flex-row center">
          {!hasProgressBar && <IconSpin/>}
          <div className="activity-text">
            <FormattedMessage
              id={`activity.${type}`}
              values={{ progress, total, hasProgressBar }}/>
          </div>
          {hasCancelButton &&
            <Button
              icon={<IconXSmall/>}
              onClick={() => onCancel(id)}/>}
        </div>
        {hasProgressBar &&
          <div className="flex-row center">
            <progress value={progress} max={total}/>
          </div>
        }
      </div>
    </div>
  )
}

Activity.propTypes = {
  canCancel: bool,
  type: string.isRequired,
  id: number.isRequired,
  progress: number,
  total: number,
  onCancel: func
}


export class ActivityPane extends React.PureComponent {
  componentDidMount() {
    this.resume()
  }

  componentDidUpdate() {
    this.resume()
  }

  componentWillUnmount() {
    this.stop()
  }

  resume() {
    this.stop()
    if (this.hasPendingActivities) {
      this.timeout = setTimeout(() =>
        this.forceUpdate(),
        this.props.delay / 2)
    }
  }

  stop() {
    clearTimeout(this.timeout)
    this.timeout = null
  }

  getBusyActivities(now = Date.now(), delay = this.props.delay) {
    return this.props.activities.filter(activity => (
      !activity.done &&
        (now - activity.init) > delay))
  }

  render() {
    let activities = this.getBusyActivities()
    let busy = activities.length > 0
    let height = ActivityPane.getHeight(activities.length)

    this.hasPendingActivities =
      activities.length < this.props.activities.length

    return (
      <div
        className={cx('activity-pane', { busy })}
        style={{ height }}>
        {activities.map(({ id, cancel, type, progress, total }) =>
          <Activity
            key={id}
            id={id}
            type={type}
            progress={progress}
            total={total}
            canCancel={cancel}
            onCancel={this.props.onCancel}/>)}
      </div>
    )
  }

  static getHeight(count) {
    return count ? count * SASS.ACTIVITY.HEIGHT : 0
  }

  static propTypes = {
    activities: arrayOf(shape({
      id: number.isRequired,
      cancel: bool,
      type: string.isRequired,
      init: number.isRequired,
      progress: number,
      total: number
    })).isRequired,

    delay: number.isRequired,
    onCancel: func.isRequired
  }

  static defaultProps = {
    delay: 400
  }
}
