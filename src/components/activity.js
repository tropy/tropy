'use strict'

const React = require('react')
const { IconSpin, IconXSmall } = require('./icons')
const { FormattedMessage } = require('react-intl')
const cx = require('classnames')
const { ACTIVITY } = require('../constants/sass')
const { arrayOf, shape, string, number, func } = require('prop-types')
const { Button } = require('./button')


const Activity = ({ type, progress, total, onCancel }) => {
  let hasProgressBar = (progress != null || !isNaN(progress))
  let hasCancelButton = false

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
            <Button icon={<IconXSmall/>} onClick={onCancel}/>}
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
  type: string.isRequired,
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
        {activities.map(({ id, type, progress, total }) =>
          <Activity
            key={id}
            type={type}
            progress={progress}
            total={total}/>)}
      </div>
    )
  }

  static getHeight(count) {
    return count ? count * ACTIVITY.HEIGHT : 0
  }

  static propTypes = {
    activities: arrayOf(shape({
      id: number.isRequired,
      type: string.isRequired,
      init: number.isRequired,
      progress: number,
      total: number
    })).isRequired,

    delay: number.isRequired
  }

  static defaultProps = {
    delay: 400
  }
}


module.exports = {
  Activity,
  ActivityPane
}
