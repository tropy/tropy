import { useSelector } from 'react-redux'
import { useOnline } from '../../hooks/use-online.js'
import { Icon } from '../icons.js'

export const AccountStatus = () => {
  let account = useSelector(state => state.account)
  let online = useOnline()

  if (!account.linked) {
    return null
  }
  if (account.error) {
    return <Icon name="WarningSignSm" title={account.error}/>
  }
  if (online) {
    return null
  }
  return (
    <Icon name="Ghost" title="error.account.offline"/>
  )
}
