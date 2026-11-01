import { useArgs } from '../../hooks/use-args.js'
import { useOnline } from '../../hooks/use-online.js'
import { FormattedIcon } from '../icons.js'

export const AccountStatus = () => {
  let account = useArgs('account')
  let online = useOnline()

  if (!account.linked) {
    return null
  }
  if (account.error) {
    return <FormattedIcon name="WarningSignSm" title={account.error}/>
  }
  if (online) {
    return null
  }
  return (
    <FormattedIcon name="WifiWarning" title="error.account.offline"/>
  )
}
