import { useIntl } from 'react-intl'
import { useIpcEvent } from '../hooks/use-ipc.js'

export const Link = ({ children, id, ...opts }) => {
  let intl = useIntl()

  let url = intl.formatMessage({ id: `${id}.url` }, opts)
  let text = children ?? intl.formatMessage({ id: `${id}.title` }, opts)

  let handleClick = useIpcEvent(null, ['shell', 'open', url])

  return (
    <a onClick={handleClick}>{text}</a>
  )
}
