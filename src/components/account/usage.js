import { useEffect, useState, useTransition } from 'react'
import { FormattedMessage } from 'react-intl'
import { usage } from '../../account.js'
import { RelativeDate } from '../date.js'

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

  let hasLimit = data?.limit != null

  return (
    <div className="card usage">
      <h1><FormattedMessage id="prefs.account.usage.label"/></h1>
      <h2><FormattedMessage id="prefs.account.usage.transcriptions.label"/></h2>
      {hasLimit ? (
        <progress value={data.total} max={data.limit}/>
      ) : (
        <progress/>
      )}
      {data && (
        <p className="legend">
          {hasLimit ? (
            <FormattedMessage
              id="prefs.account.usage.transcriptions.limit"
              values={{
                delta: Math.max(0, data.limit - data.total),
                limit: data.limit,
                reset: (
                  <RelativeDate
                    threshold={86400 * 3}
                    value={data.reset * 1000}/>
                )
              }}/>
          ) : (
            <FormattedMessage
              id="prefs.account.usage.transcriptions.total"
              values={{
                total: data.total,
                since: (
                  <RelativeDate
                    threshold={86400 * 3}
                    value={data.since * 1000}/>
                )
              }}/>
          )}
        </p>
      )}
    </div>
  )
}
