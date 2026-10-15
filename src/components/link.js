import { useIntl } from 'react-intl'
import { useIpcEvent } from '../hooks/use-ipc.js'

export const Link = ({
  className,
  children,
  id,
  title,
  url,
  ...opts
}) => {
  let intl = useIntl()

  // The `id` messages fill in a missing url and text.
  let message = (key) => (id == null) ?
    undefined :
    intl.formatMessage({ id: `${id}.${key}` }, opts)

  let href = url ?? message('url')
  let text = children ?? message('title')
  // title ?? message('hint')

  let handleClick = useIpcEvent(null, ['shell', 'open', href])

  return (
    <a className={className} onClick={handleClick} title={title}>
      {text}
    </a>
  )
}
