import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Login } from './login.js'
import { Profile } from './profile.js'
import { Fade, SwitchTransition } from '../fx.js'
import { status, unlink } from '../../slices/account.js'


export function AccountSettings ({ timeout = 300 }) {
  let dispatch = useDispatch()
  let account = useSelector(state => state.account)
  let nodeRef = useRef(null)

  useEffect(() => {
    dispatch(status())
  }, [dispatch])

  let handleUnlink = useCallback(() => {
    dispatch(unlink())
  }, [dispatch])

  return (
    <SwitchTransition>
      <Fade
        key={account.linked ? 'profile' : 'login'}
        nodeRef={nodeRef}
        timeout={timeout}>
        {account.linked ? (
          <Profile
            ref={nodeRef}
            account={account}
            onUnlink={handleUnlink}/>
        ) : (
          <Login ref={nodeRef}/>
        )}
      </Fade>
    </SwitchTransition>
  )
}
