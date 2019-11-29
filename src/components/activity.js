'use strict'

const { isFunction } = require('util')
const React = require('react')
const { IconSpin, IconXSmall } = require('./icons')
const { FormattedMessage } = require('react-intl')
const cx = require('classnames')
const { ACTIVITY } = require('../constants/sass')
const { arrayOf, bool, shape, string, number, func } = require('prop-types')
const { Button } = require('./button')


const Activity = ({ id, type, progress, total, canCancel, onCancel }) => {
  let hasProgressBar = (progress != null || !isNaN(progress))
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


class ActivityPane extends React.PureComponent {
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
    return count ? count * ACTIVITY.HEIGHT : 0
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


module.exports = {
  Activity,
  ActivityPane
}
