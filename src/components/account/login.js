import { useCallback, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { useArgs } from '../../hooks/use-args.js'
import { useIpcEventHandler, useIpcSend } from '../../hooks/use-ipc.js'
import { Button } from '../button.js'
import { Link } from '../link.js'
import { Form, FormElement } from '../form.js'

export function Login ({ ref }) {
  let authUrl = useArgs('auth')

  let link = useIpcSend(['account', 'link'])
  let [isPending, setPending] = useState(false)
  let [error, setError] = useState(null)

  useIpcEventHandler('account/error', (_, payload) => {
    setError(payload?.code || 'account.link.error')
    setPending(false)
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
    <Form ref={ref} onSubmit={handleSubmit}>
      <figure className="app-icon"/>
      <legend>
        <p className="form-description">
          <FormattedMessage id="prefs.account.description"/>
        </p>
      </legend>
      <FormElement id="prefs.account.username" isCompact>
        <input
          id="prefs.account.username"
          className="form-control"
          name="username"
          type="text"
          autoComplete="username"
          disabled={isPending}
          required
          tabIndex={0}/>
      </FormElement>
      <Link url={`${authUrl}/forgot`}>
        <FormattedMessage id="prefs.account.forgot"/>
      </Link>
      <FormElement id="prefs.account.password" isCompact>
        <input
          id="prefs.account.password"
          className="form-control"
          name="password"
          type="password"
          autoComplete="current-password"
          disabled={isPending}
          required
          tabIndex={0}/>
      </FormElement>
      <FormElement size={8}>
        <Button
          isDefault
          isPrimary
          isDisabled={isPending}
          text="prefs.account.link"
          type="submit"/>
        {error && (
          <p className="form-description error">
            <FormattedMessage id={error}/>
          </p>
        )}
      </FormElement>
      <p>
        <FormattedMessage id="prefs.account.register.1"/>
        <Link url={`${authUrl}/signup`}>
          <FormattedMessage id="prefs.account.register.2"/>
        </Link>
      </p>
    </Form>
  )
}
