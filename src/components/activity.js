'use strict'

const React = require('react')
const { PureComponent } = React
const { PropTypes } = require('prop-types')
const { IconSpin, IconX } = require('./icons')
const { FormattedMessage } = require('react-intl')
const cx = require('classnames')
const { ACTIVITY } = require('../constants/sass')
const { arrayOf, shape, string, number, func } = PropTypes
const { IconButton } = require('./button')



const Activity = ({ type, progress, total, onCancel }) => {
  const hasProgressBar = (progress != null)
  const hasCancelButton = false

  if (hasCancelButton) {
    var CancelButton = (
      <IconButton icon={<IconX/>} onClick={onCancel}/>
    )
  }

  if (hasProgressBar) {
    var ProgressBar = (
      <div className="flex-row center">
        <progress value={progress} max={total}/>
      </div>
    )
  }

  return (
    <div className={cx({ activity: true, type })}>
      <div className="activity-container">
        <div className="flex-row center">
          {!hasProgressBar && <IconSpin/>}
          <div className="activity-text">
            <FormattedMessage
              id={`activity.${type}`}
              values={{ progress, total }}/>
          </div>
          {CancelButton}
        </div>
        {ProgressBar}
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


class ActivityPane extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      activities: props.activities.filter(this.busy)
    }
  }

  componentDidMount() {
    this.resume()
  }

  componentWillUnmount() {
    this.stop()
  }

  componentWillReceiveProps(props) {
    if (this.props.activities !== props.activities) {
      this.setState({
        activities: props.activities.filter(this.busy)
      })

      this.resume()
    }
  }

  get hasPendingActivities() {
    return this.state.activities.length < this.props.activities.length
  }

  get isBusy() {
    return this.state.activities.length > 0
  }

  get style() {
    return {
      height: getHeight(this.state.activities.length)
    }
  }

  resume() {
    this.stop()

    if (this.hasPendingActivities) {
      this.timeout = setTimeout(this.update, this.props.delay / 2)
    }
  }

  stop() {
    clearTimeout(this.timeout)
    this.timeout = null
  }

  update = () => {
    const activities = this.props.activities.filter(this.busy)

    if (activities.length > this.state.activities) {
      this.setState({ activities })
    }

    this.resume()
  }

  busy = (activity) => (
    !activity.done && (Date.now() - activity.init) > this.props.delay
  )

  render() {
    return (
      <div
        className={cx({ 'activity-pane': true, 'busy': this.isBusy })}
        style={this.style}>

        {this.state.activities.map(({ id, type, progress, total }) =>
          <Activity key={id} type={type} progress={progress} total={total}/>)}

      </div>
    )
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
    delay: 500
  }
}

function getHeight(count) {
  return count ? count * ACTIVITY.HEIGHT : 0
}


module.exports = {
  Activity,
  ActivityPane
}
