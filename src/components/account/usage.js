import { useEffect, useState, useTransition } from 'react'
import { FormattedMessage } from 'react-intl'
import { usage } from '../../account.js'
import { RelativeDate } from '../date.js'

const scale = (data, padding = 1.25) =>
  Math.max(1, padding * Math.max(...data.map(w => w.total)))

export function Usage () {
  let [data, setData] = useState(null)
  let [, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      try {
        setData(await usage())
      } catch {
        setData(null)
      }
    })
  }, [])

  return (
    <div className="card usage">
      <h1><FormattedMessage id="prefs.account.usage.label"/></h1>
      <p className="key">
        <FormattedMessage id="prefs.account.usage.transcriptions.label"/>
      </p>
      {data?.length ? (
        data.map(({ key, limit, reset, since, total }) => (
          <UsageMeter
            key={key}
            id={key}
            limit={limit}
            reset={reset}
            scale={scale(data)}
            since={since}
            total={total}/>
        ))
      ) : (
        <PendingMeter/>
      )}
    </div>
  )
}

const PendingMeter = () => (
  <div className="meter">
    <progress/>
    <p className="progress-description">
      <FormattedMessage id="prefs.account.usage.transcriptions.loading"/>
    </p>
  </div>
)

const UsageMeter = ({ id, limit, reset, scale, since, total }) => (
  <div className="meter">
    <p className="window">
      <FormattedMessage
        id={`prefs.account.usage.window.${id}`}
        defaultMessage={id}/>
    </p>
    <progress
      aria-describedby={`usage-${id}`}
      className={limit == null ? 'unscaled' : null}
      value={total}
      max={limit ?? scale}/>
    <p className="progress-description" id={`usage-${id}`}>
      {limit == null ? (
        <FormattedMessage
          id="prefs.account.usage.transcriptions.total"
          values={{
            total,
            since: (
              <RelativeDate threshold={86400 * 3} value={since * 1000}/>
            )
          }}/>
      ) : (
        <FormattedMessage
          id="prefs.account.usage.transcriptions.limit"
          values={{
            delta: Math.max(0, limit - total),
            limit,
            reset: (
              <RelativeDate threshold={86400 * 3} value={reset * 1000}/>
            )
          }}/>
      )}
    </p>
  </div>
)
