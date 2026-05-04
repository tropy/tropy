import { useIntl } from 'react-intl'
import { useIpcEvent } from '../hooks/use-ipc.js'

export const Link = ({
  className,
  children: text,
  id,
  title,
  url,
  ...opts
}) => {
  let intl = useIntl()

  if (id != null) {
    url ??= intl.formatMessage({ id: `${id}.url` }, opts)
    text ??= intl.formatMessage({ id: `${id}.title` }, opts)
    title ??= intl.formatMessage({ id: `${id}.hint` }, opts)
  }

  let handleClick = useIpcEvent(null, ['shell', 'open', url])

  return (
    <a className={className} onClick={handleClick} title={title}>
      {text}
    </a>
  )
}
