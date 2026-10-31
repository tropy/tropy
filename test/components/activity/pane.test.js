import { mock } from 'node:test'
import { fireEvent, waitFor } from '@testing-library/react'
import { render, createStore, withStore } from '../../support/react.js'
import { ActivityPane } from '#tropy/components/activity/index.js'
import { cancel, start } from '#tropy/slices/activities.js'

const activity = (id, init, props) => ({
  id, init, due: init + 400, type: 'test', ...props
})

// Started activities become due after 20ms.
const started = (seq) => {
  let action = start({ type: 'test', meta: { seq } })
  action.meta.now = Date.now() - 380
  return action
}

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

  it('never shows hidden activities', async () => {
    let now = Date.now()
    let store = createStore({
      activities: {
        1: activity(1, now - 1000),
        2: activity(2, now - 1000, { hidden: true })
      }
    })

    let { container } = render(<ActivityPane/>, withStore(store))

    await waitFor(() => {
      expect(container.querySelectorAll('.activity')).to.have.length(1)
    })
  })

  it('renders completed steps as progress', async () => {
    let store = createStore({
      activities: {
        1: activity(1, Date.now() - 1000, {
          type: 'item.import', progress: 2, total: 5
        })
      }
    })

    let { container } = render(<ActivityPane/>, withStore(store))

    await waitFor(() => {
      expect(container.querySelector('.activity-text'))
        .to.have.text('Imported 1 of 5 items …')
    })
    expect(container.querySelector('progress')).to.have.property('value', 1)
  })

  it('shows pending activities once they exceed the delay', async () => {
    let store = createStore()
    let { container } = render(<ActivityPane/>, withStore(store))

    store.dispatch(started(1))
    await waitFor(() => {
      expect(container.querySelectorAll('.activity')).to.have.length(1)
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    store.dispatch(started(2))
    expect(container.querySelectorAll('.activity')).to.have.length(1)
    await waitFor(() => {
      expect(container.querySelectorAll('.activity')).to.have.length(2)
    })
  })

  it('shows activities in sync across components', async () => {
    let store = createStore()
    let { container } = render(
      <>
        <ActivityPane/>
        <ActivityPane/>
      </>,
      withStore(store))

    store.dispatch(started(1))

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
      .to.have.property('type', cancel.type)
  })
})
