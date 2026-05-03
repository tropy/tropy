import { useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { Button } from '../button.js'
import { Form, FormElement } from '../form.js'
import { link } from '../../slices/account.js'


export function Login ({ ref }) {
  let dispatch = useDispatch()
  let account = useSelector(state => state.account)

  let usernameRef = useRef(null)
  let passwordRef = useRef(null)

  let handleSubmit = useCallback((event) => {
    event.preventDefault()
    let username = usernameRef.current?.value?.trim()
    let password = passwordRef.current?.value
    if (!username || !password) return

    dispatch(link({ username, password }))
  }, [dispatch])

  let isPending = account.status === 'pending'

  return (
    <Form ref={ref} onSubmit={handleSubmit}>
      <figure className="app-icon"/>
      <FormElement size={8}>
        <p className="form-description">
          <FormattedMessage id="prefs.account.description"/>
        </p>
      </FormElement>
      <div className="form-group">
        <label htmlFor="prefs.account.username" className="control-label col-4">
          <FormattedMessage id="prefs.account.username"/>
        </label>
        <div className="col-8">
          <input
            ref={usernameRef}
            id="prefs.account.username"
            className="form-control"
            type="text"
            autoComplete="username"
            disabled={isPending}
            required/>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="prefs.account.password" className="control-label col-4">
          <FormattedMessage id="prefs.account.password"/>
        </label>
        <div className="col-8">
          <input
            ref={passwordRef}
            id="prefs.account.password"
            className="form-control"
            type="password"
            autoComplete="current-password"
            disabled={isPending}
            required/>
        </div>
      </div>
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
    </Form>
  )
}
