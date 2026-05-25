import { useCallback, useEffect, useState, useTransition } from 'react'
import { FormattedMessage } from 'react-intl'
import { prompt } from '../../dialog.js'
import { useIpc } from '../../hooks/use-ipc.js'
import { Button } from '../button.js'

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
        setError(payload?.code || 'account.profile.error')
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
    <div ref={ref} className="profile">
      <h1><FormattedMessage id="prefs.account.label"/></h1>
      {error ? (
        <>
          <p className="error">
            <FormattedMessage id={error}/>
          </p>
          <Button
            isDefault
            isDisabled={isPending}
            text="prefs.account.retry"
            onClick={loadProfile}/>
        </>
      ) : (
        details
          .filter(name => profile?.[name])
          .map(name => (
            <AccountDetail
              key={name}
              name={name}
              value={profile[name]}/>
          ))
      )}
      <hr/>
      <Button
        isDefault
        isDisabled={isPending}
        text="prefs.account.unlink"
        onClick={handleUnlink}/>
    </div>
  )
}

const AccountDetail = ({ name, value }) => (
  <div className="account-detail">
    <label><FormattedMessage id={`prefs.account.${name}`}/></label>
    <p>{value}</p>
  </div>
)
