import { useCallback, useEffect, useState, useTransition } from 'react'
import { FormattedMessage } from 'react-intl'
import { prompt } from '../../dialog.js'
import { useIpc } from '../../hooks/use-ipc.js'
import { Button } from '../button.js'
import { Usage } from './usage.js'

export function Profile ({
  details = ['username', 'email'],
  ref
}) {
  let ipc = useIpc()

  let [profile, setProfile] = useState(null)
  let [isPending, startTransition] = useTransition()
  let [error, setError] = useState(null)

  let loadProfile = useCallback(() => {
    startTransition(async () => {
      let { error, payload } = await ipc.invoke('account', 'profile')

      if (error) {
        setError({
          message: payload?.message || 'error.account.profile.unknown',
          type: payload?.type || 'error'
        })
      } else {
        setError(null)
        setProfile(payload)
      }
    })
  }, [ipc])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  let handleUnlink = useCallback(() => {
    prompt('account.unlink', { type: 'warning' })
      .then(({ cancel }) => {
        if (!cancel) {
          startTransition(async () => {
            await ipc.invoke('account', 'unlink')
            setProfile(null)
          })
        }
      })
  }, [ipc])

  return (
    <>
      {error && (
        <ul className="messages">
          <li className={`card message ${error.type}`}>
            <p>
              <FormattedMessage id={error.message}/>
            </p>
            <Button
              isLink
              isDisabled={isPending}
              text="prefs.account.retry"
              onClick={loadProfile}/>
          </li>
        </ul>
      )}
      <div ref={ref}>
        <div className="card profile">
          <header>
            <h1><FormattedMessage id="prefs.account.label"/></h1>
            <Button
              isLink
              isDisabled={isPending}
              text="prefs.account.unlink"
              onClick={handleUnlink}/>
          </header>
          {!error && (
            <dl>
              {details
                .filter(name => profile?.[name])
                .map(name => (
                  <AccountDetail
                    key={name}
                    name={name}
                    value={profile[name]}/>
                ))}
            </dl>
          )}
        </div>
        {!error && <Usage/>}
      </div>
    </>
  )
}

const AccountDetail = ({ name, value }) => (
  <>
    <dt><FormattedMessage id={`prefs.account.${name}`}/></dt>
    <dd>{value}</dd>
  </>
)
