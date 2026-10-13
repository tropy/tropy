import { mock } from 'node:test'
import { fireEvent, waitFor } from '@testing-library/react'
import { render, createStore, withStore } from '../../support/react.js'
import { ActivityPane } from '#tropy/components/activity/index.js'
import { ACTIVITY } from '#tropy/constants/index.js'

const activity = (id, init, props) => ({
  id, init, type: 'test', ...props
})

const start = (seq) => ({
  type: 'test',
  meta: { cmd: 'project', seq, now: Date.now() }
})

describe('ActivityPane', () => {
  it('renders only activities exceeding the delay', async () => {
    let now = Date.now()
    let store = createStore({
      activities: {
        1: activity(1, now - 1000),
        2: activity(2, now)
      }
    })

    let { container } = render(<ActivityPane/>, withStore(store))

    await waitFor(() => {
      expect(container.querySelector('.activity-pane')).to.have.class('busy')
    })
    expect(container.querySelectorAll('.activity')).to.have.length(1)
  })

  it('shows pending activities once they exceed the delay', async () => {
    let store = createStore()
    let { container } = render(<ActivityPane delay={20}/>, withStore(store))

    store.dispatch(start(1))
    await waitFor(() => {
      expect(container.querySelectorAll('.activity')).to.have.length(1)
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    store.dispatch(start(2))
    expect(container.querySelectorAll('.activity')).to.have.length(1)
    await waitFor(() => {
      expect(container.querySelectorAll('.activity')).to.have.length(2)
    })
  })

  it('shows activities in sync across components', async () => {
    let store = createStore()
    let { container } = render(
      <>
        <ActivityPane delay={20}/>
        <ActivityPane delay={20}/>
      </>,
      withStore(store))

    store.dispatch(start(1))

    await waitFor(() => {
      expect(container.querySelectorAll('.activity')).to.have.length.above(0)
    })
    expect(container.querySelectorAll('.activity')).to.have.length(2)
  })

  it('dispatches cancel', async () => {
    let store = createStore({
      activities: {
        1: activity(1, Date.now() - 1000, { cancel: true })
      }
    })
    let dispatch = mock.method(store, 'dispatch')

    let { container } = render(<ActivityPane/>, withStore(store))
    await waitFor(() => {
      expect(container.querySelector('.activity button')).to.exist
    })
    fireEvent.click(container.querySelector('.activity button'))

    expect(dispatch.mock.calls[0].arguments[0])
      .to.have.property('type', ACTIVITY.CANCEL)
  })
})
