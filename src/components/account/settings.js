import { useRef } from 'react'
import { useArgs } from '../../hooks/use-args.js'
import { Login } from './login.js'
import { Profile } from './profile.js'
import { Fade, SwitchTransition } from '../fx.js'

export function AccountSettings ({ timeout = 300 }) {
  let account = useArgs('account')
  let nodeRef = useRef(null)

  return (
    <SwitchTransition>
      <Fade
        key={account.linked ? 'profile' : 'login'}
        nodeRef={nodeRef}
        timeout={timeout}>
        {account.linked ? (
          <Profile ref={nodeRef}/>
        ) : (
          <Login ref={nodeRef}/>
        )}
      </Fade>
    </SwitchTransition>
  )
}
