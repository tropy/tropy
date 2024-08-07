import { FormattedDate, FormattedRelativeTime } from 'react-intl'


export const RelativeDate = ({
  origin,
  threshold = 86400 * 2,
  value
}) => {
  let delta = Math.round((value - (origin ?? Date.now())) / 1000)
  let seconds = Math.abs(delta)

  if (seconds > threshold) {
    return (
      <FormattedDate
        day="numeric"
        month="short"
        year="numeric"
        value={value}/>
    )
  }

  let unit
  let updateIntervalInSeconds

  if (seconds < 60) {
    unit = 'second'
    updateIntervalInSeconds = 10
  } else if (seconds < 3600) {
    unit = 'minute'
    delta = Math.round(delta / 60)
    updateIntervalInSeconds = 60
  } else if (seconds < 86400) {
    unit = 'hour'
    delta = Math.round(delta / 3600)
  } else if (seconds < 86400 * 7) {
    unit = 'day'
    delta = Math.round(delta / 86400)
  } else {
    unit = 'week'
    delta = Math.round(delta / (86400 * 7))
  }

  return (
    <FormattedRelativeTime
      numeric="auto"
      style="long"
      unit={unit}
      updateIntervalInSeconds={updateIntervalInSeconds}
      value={delta}/>
  )
}
