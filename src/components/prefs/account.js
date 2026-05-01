import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { Button } from '../button.js'
import { Form, FormElement, FormText } from '../form.js'
import * as act from '../../actions/index.js'


export function AccountSettings () {
  let dispatch = useDispatch()
  let account = useSelector(state => state.account)

  let usernameRef = useRef(null)
  let passwordRef = useRef(null)

  useEffect(() => {
    dispatch(act.account.status())
  }, [dispatch])

  let handleLink = useCallback((event) => {
    event.preventDefault()
    let username = usernameRef.current?.value?.trim()
    let password = passwordRef.current?.value
    if (!username || !password) return

    dispatch(act.account.link({ username, password }))
  }, [dispatch])

  let handleUnlink = useCallback(() => {
    dispatch(act.account.unlink())
  }, [dispatch])

  let isPending = account.status === 'pending'

  if (account.linked) {
    return (
      <Form>
        <FormText
          id="prefs.account.linked_as"
          value={account.username}/>
        <FormElement size={8}>
          <Button
            isDefault
            isDisabled={isPending}
            text="prefs.account.unlink"
            onClick={handleUnlink}/>
        </FormElement>
      </Form>
    )
  }

  return (
    <form className="form-horizontal" onSubmit={handleLink}>
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
    </form>
  )
}
