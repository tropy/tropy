import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { useArgs } from '../../hooks/use-args.js'
import { Button } from '../button.js'
import { Link } from '../link.js'
import { Form, FormElement, FormField } from '../form.js'
import { link } from '../../slices/account.js'


export function Login ({ ref }) {
  let authUrl = useArgs('auth')

  let dispatch = useDispatch()
  let account = useSelector(state => state.account)

  let handleSubmit = useCallback((event) => {
    event.preventDefault()
    let form = event.target
    let username = form.username?.value?.trim()
    let password = form.password?.value
    if (!username || !password) return

    dispatch(link({ username, password }))
  }, [dispatch])

  let isPending = account.status === 'pending'

  return (
    <Form ref={ref} onSubmit={handleSubmit}>
      <figure className="app-icon"/>
      <legend>
        <p className="form-description">
          <FormattedMessage id="prefs.account.description"/>
        </p>
      </legend>
      <FormField
        id="prefs.account.username"
        name="username"
        isCompact
        isRequired
        disabled={isPending}
        tabIndex={0}/>
      <Link url={`${authUrl}/forgot`}>
        <FormattedMessage id="prefs.account.forgot"/>
      </Link>
      <FormField
        id="prefs.account.password"
        name="password"
        isCompact
        isRequired
        disabled={isPending}
        tabIndex={0}
        type="password"/>
      <FormElement size={8}>
        <Button
          isDefault
          isPrimary
          isDisabled={isPending}
          text="prefs.account.link"
          type="submit"/>
        {account.error && (
          <p className="form-description error">
            <FormattedMessage id={account.error}/>
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
