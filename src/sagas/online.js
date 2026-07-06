import { eventChannel } from 'redux-saga'

export function OnlineChannel () {
  return eventChannel(emitter => {
    let onOnline = () => emitter({ online: true })
    window.addEventListener('online', onOnline)

    return () => {
      window.removeEventListener('online', onOnline)
    }
  })
}
