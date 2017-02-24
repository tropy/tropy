'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { IconSpin } = require('./icons')
const { FormattedMessage } = require('react-intl')
const cx = require('classnames')
const { STYLE } = require('../constants')
const { arrayOf, shape, string, number } = PropTypes


class ActivityPane extends PureComponent {
  get isBusy() {
    return this.props.activities.length > 0
  }

  get style() {
    return {
      height: getHeight(this.props.activities.length)
    }
  }

  render() {

    return (
      <div
        className={cx({ 'activity-pane': true, 'busy': this.isBusy })}
        style={this.style}>
        <div className="activity-container">{
          this.props.activities.map(({ id, type }) =>
            <div key={id} className={cx({ activity: true, type })}>
              <IconSpin/>
              <FormattedMessage id={`activity.${type}`}/>
            </div>
          )
        }</div>
      </div>
    )
  }

  static propTypes = {
    activities: arrayOf(shape({
      id: number.isRequired,
      type: string.isRequired
    })).isRequired
  }
}

function getHeight(count) {
  return count ? count * STYLE.ACTIVITY.HEIGHT + STYLE.ACTIVITY.PADDING : 0
}


module.exports = {
  ActivityPane
}
