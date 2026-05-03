import { FormattedMessage } from 'react-intl'
import { Button } from '../button.js'

const AccountDetail = ({ name, value }) => (
  <div className="account-detail">
    <label><FormattedMessage id={`prefs.account.${name}`}/></label>
    <p>{value}</p>
  </div>
)

export function Profile ({
  account,
  details = ['username', 'email'],
  onUnlink,
  ref
}) {
  let isPending = account.status === 'pending'

  return (
    <div ref={ref} className="profile">
      <h1><FormattedMessage id="prefs.account.label"/></h1>
      {details
        .filter(name => account[name])
        .map(name => (
          <AccountDetail
            key={name}
            name={name}
            value={account[name]}/>
        ))}
      <hr/>
      <Button
        isDefault
        isDisabled={isPending}
        text="prefs.account.unlink"
        onClick={onUnlink}/>
    </div>
  )
}
