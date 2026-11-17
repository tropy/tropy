import { mock } from 'node:test'
import { fireEvent, waitFor } from '@testing-library/react'
import { render, createStore, withStore } from '../../support/react.js'
import { ActivityPane } from '#tropy/components/activity/index.js'
import { cancel, start } from '#tropy/slices/activities.js'
import { dismiss } from '#tropy/slices/completed.js'

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
      expect(container.querySelector('.activity .btn')).to.exist
    })
    fireEvent.click(container.querySelector('.activity .btn'))

    expect(dispatch.mock.calls[0].arguments[0])
      .to.have.property('type', cancel.type)
  })

  it('renders completed activities with items until they expire', async () => {
    let now = Date.now()
    let store = createStore({
      completed: {
        'item.import': {
          type: 'item.import', done: now, expires: now + 50,
          items: [1], errors: 2
        },
        'tag.export': { type: 'tag.export', done: now, expires: now + 60000 }
      }
    })

    let { container } = render(<ActivityPane/>, withStore(store))

    expect(container.querySelectorAll('.activity.completed')).to.have.length(1)
    expect(container.querySelector('.activity.completed'))
      .to.have.text('1 item imported, 2 failed')

    await waitFor(() => {
      expect(container.querySelector('.activity.completed')).to.be.null
    })
  })

  it('keeps the activity shown after it expires', async () => {
    let now = Date.now()
    let store = createStore({
      completed: {
        'item.import': {
          type: 'item.import', done: now, expires: now + 50,
          items: [1]
        }
      }
    })
    store.dispatch({
      type: 'nav.update',
      payload: { view: { name: 'activity', type: 'item.import' } }
    })

    let { container } = render(<ActivityPane/>, withStore(store))

    await new Promise(resolve => setTimeout(resolve, 100))
    expect(container.querySelector('.activity.completed'))
      .to.have.class('active')

    // Leaving the view leaves the expired record.
    store.dispatch({ type: 'nav.update', payload: { view: { name: 'trash' } } })
    await waitFor(() => {
      expect(container.querySelector('.activity.completed')).to.be.null
    })
  })

  it('dispatches dismiss', () => {
    let now = Date.now()
    let store = createStore({
      completed: {
        'item.import': {
          type: 'item.import', done: now, expires: now + 60000, items: []
        }
      }
    })
    let dispatch = mock.method(store, 'dispatch')

    let { container } = render(<ActivityPane/>, withStore(store))
    fireEvent.click(container.querySelector('.activity.completed .btn'))

    expect(dispatch.mock.calls[0].arguments[0])
      .to.eql(dismiss('item.import'))
  })

  it('shows the items of completed activities', () => {
    let now = Date.now()
    let record = (type, items) =>
      ({ type, done: now, expires: now + 60000, items })
    let store = createStore({
      completed: {
        'item.import': record('item.import', [1]),
        'tag.export': record('tag.export', [])
      }
    })
    let dispatch = mock.method(store, 'dispatch')

    let { container } = render(<ActivityPane/>, withStore(store))
    let [withItems, withoutItems] =
      container.querySelectorAll('.activity.completed')

    fireEvent.click(withoutItems)
    expect(dispatch.mock.callCount()).to.equal(0)

    fireEvent.click(withItems)
    expect(dispatch.mock.calls[0].arguments[0].payload)
      .to.eql({ view: { name: 'activity', type: 'item.import' } })
  })

  it('dismisses without selecting', () => {
    let now = Date.now()
    let store = createStore({
      completed: {
        'item.import': {
          type: 'item.import',
          done: now,
          expires: now + 60000,
          items: [1]
        }
      }
    })
    let dispatch = mock.method(store, 'dispatch')

    let { container } = render(<ActivityPane/>, withStore(store))
    fireEvent.click(container.querySelector('.activity.completed .btn'))

    expect(dispatch.mock.callCount()).to.equal(1)
    expect(dispatch.mock.calls[0].arguments[0])
      .to.eql(dismiss('item.import'))
  })
})
