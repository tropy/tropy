import { useCallback, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { useArgs } from '../../hooks/use-args.js'
import { useIpcEventHandler, useIpcSend } from '../../hooks/use-ipc.js'
import { Button } from '../button.js'
import { Link } from '../link.js'
import { FormElement } from '../form.js'
import { Password } from '../password.js'

export function Login ({ ref }) {
  let authUrl = useArgs('auth')

  let link = useIpcSend(['account', 'link'])
  let [isPending, setPending] = useState(false)
  let [error, setError] = useState(null)

  useIpcEventHandler('account/error', (_, cmd, payload) => {
    if (cmd === 'link') {
      setError(payload?.code || 'account.link.error')
      setPending(false)
    }
  })

  let handleSubmit = useCallback((event) => {
    event.preventDefault()
    let form = event.target
    let username = form.username?.value?.trim()
    let password = form.password?.value
    if (!username || !password) return

    setError(null)
    setPending(true)
    link({ username, password })
  }, [link])

  return (
    <div className="login">
      <figure className="tropy-icon"/>
      <h1><FormattedMessage id="prefs.account.description"/></h1>
      <form ref={ref} onSubmit={handleSubmit}>
        <FormElement id="prefs.account.username" isCompact>
          <input
            id="prefs.account.username"
            className="form-control form-control-lg"
            name="username"
            type="text"
            autoComplete="none"
            disabled={isPending}
            required
            tabIndex={0}/>
        </FormElement>
        <FormElement id="prefs.account.password" isCompact>
          <div>
            <Link url={`${authUrl}/password/forgot`} className="form-link">
              <FormattedMessage id="prefs.account.forgot"/>
            </Link>
          </div>
          <Password
            id="prefs.account.password"
            className="form-control form-control-lg"
            name="password"
            autoComplete="off"
            disabled={isPending}
            required
            tabIndex={0}/>
        </FormElement>
        <Button
          isPrimary
          isBlock
          size="xl"
          tabIndex={0}
          isDisabled={isPending}
          text="prefs.account.link"
          type="submit"/>
        {error && (
          <p className="form-description error">
            <FormattedMessage id={error}/>
          </p>
        )}
        <p className="switch">
          <FormattedMessage id="prefs.account.register.1"/>
          {' '}
          <Link url={`${authUrl}/signup`}>
            <FormattedMessage id="prefs.account.register.2"/>
          </Link>
        </p>
      </form>
    </div>
  )
}
