import { mock } from 'node:test'
import { act, fireEvent, waitFor } from '@testing-library/react'
import { render, createStore as createTestStore, withStore }
  from '../../support/react.js'
import { ActivityPane } from '#tropy/components/activity/index.js'
import { cancel, dismiss, start } from '#tropy/slices/activities.js'
import { KeyMap } from '#tropy/keymap.js'

const activity = (id, init, props) => ({
  id, init, due: init + 400, type: 'test', ...props
})

// Started activities become due after 20ms.
const started = (seq) => {
  let action = start({ type: 'test', meta: { seq } })
  action.meta.now = Date.now() - 380
  return action
}

const createStore = ({ busy = {}, past = {}, ...state } = {}) =>
  createTestStore({ ...state, activities: { busy, past } })

describe('ActivityPane', () => {
  it('renders only activities exceeding the delay', async () => {
    let now = Date.now()
    let store = createStore({
      busy: {
        1: activity(1, now - 1000),
        2: activity(2, now)
      }
    })

    let { container } = render(<ActivityPane/>, withStore(store))

    await waitFor(() => {
      expect(container.querySelectorAll('.activity')).to.have.length(1)
    })
  })

  it('lists activities by id, restored ones last by date', async () => {
    let now = Date.now()
    let record = (type, props) =>
      ({ type, done: now, expires: now + 60000, items: [], ...props })

    let store = createStore({
      busy: {
        1: activity(1, now - 1000),
        3: activity(3, now - 1000, {
          type: 'item.import', progress: 2, total: 5
        })
      },
      past: {
        'tag.export': record('tag.export', { id: 2 }),
        'list.export': record('list.export', { id: -7 }),
        'note.export': record('note.export', { id: -3, done: now - 1 })
      }
    })

    let { container } = render(<ActivityPane/>, withStore(store))

    await waitFor(() => {
      expect(container.querySelectorAll('.activity')).to.have.length(5)
    })
    expect([...container.querySelectorAll('.activity')]
      .map(node => node.classList.contains('past') ? 'past' : 'busy'))
      .to.eql(['busy', 'past', 'busy', 'past', 'past'])
    // Restored: by date (list.export is newer), not by id.
    expect(container.querySelectorAll('.activity')[3])
      .to.have.text('activity.past.list.export')
    expect(container.querySelector('.activity'))
      .to.have.text('Imported 1 of 5 items …')
  })

  it('has the tab stop while an activity is shown', () => {
    let store = createStore({})
    let { container } = render(<ActivityPane/>, withStore(store))
    let pane = container.querySelector('.activity-pane')

    expect(pane).to.have.attribute('tabindex', '-1')

    act(() => {
      store.dispatch({
        type: 'nav.select',
        payload: { view: { name: 'activity', type: 'item.import' } }
      })
    })
    expect(pane).to.have.attribute('tabindex', '2')
  })

  it('returns to the project on escape while an activity is shown', () => {
    let store = createStore({
      keymap: { ActivityPane: new KeyMap({ clear: 'Escape' }) }
    })
    let dispatch = mock.method(store, 'dispatch')
    let { container } = render(<ActivityPane/>, withStore(store))
    let pane = container.querySelector('.activity-pane')

    // Unhandled without an activity: Escape goes on (e.g. global back).
    expect(fireEvent.keyDown(pane, { key: 'Escape' })).to.be.true
    expect(dispatch.mock.callCount()).to.equal(0)

    act(() => {
      store.dispatch({
        type: 'nav.select',
        payload: { view: { name: 'activity', type: 'item.import' } }
      })
    })
    fireEvent.keyDown(pane, { key: 'Escape' })
    expect(dispatch.mock.calls.at(-1).arguments[0].payload)
      .to.eql({ view: { name: 'project' } })
  })

  it('never shows hidden activities', async () => {
    let now = Date.now()
    let store = createStore({
      busy: {
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
      busy: {
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
      busy: {
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
      past: {
        'item.import': {
          type: 'item.import', done: now, expires: now + 50,
          items: [1], errors: 2
        },
        'tag.export': { type: 'tag.export', done: now, expires: now + 60000 }
      }
    })

    let { container } = render(<ActivityPane/>, withStore(store))

    expect(container.querySelectorAll('.activity.past')).to.have.length(1)
    expect(container.querySelector('.activity.past'))
      .to.have.text('1 item imported, 2 failed')

    await waitFor(() => {
      expect(container.querySelector('.activity.past')).to.be.null
    })
  })

  it('says that a past activity was cancelled', () => {
    let now = Date.now()
    let store = createStore({
      past: {
        'item.import': {
          type: 'item.import',
          done: now,
          expires: now + 60000,
          items: [1, 2],
          cancelled: true
        }
      }
    })

    let { container } = render(<ActivityPane/>, withStore(store))
    expect(container.querySelector('.activity.past'))
      .to.have.text('2 items imported, cancelled')
  })

  it('keeps the activity shown after it expires', async () => {
    let now = Date.now()
    let store = createStore({
      past: {
        'item.import': {
          type: 'item.import', done: now, expires: now + 50,
          items: [1]
        }
      }
    })
    store.dispatch({
      type: 'nav.select',
      payload: { view: { name: 'activity', type: 'item.import' } }
    })

    let { container } = render(<ActivityPane/>, withStore(store))

    await new Promise(resolve => setTimeout(resolve, 100))
    expect(container.querySelector('.activity.past'))
      .to.have.class('active')

    // Leaving the view leaves the expired record.
    store.dispatch({ type: 'nav.select', payload: { view: { name: 'trash' } } })
    await waitFor(() => {
      expect(container.querySelector('.activity.past')).to.be.null
    })
  })

  it('dispatches dismiss', () => {
    let now = Date.now()
    let store = createStore({
      past: {
        'item.import': {
          type: 'item.import', done: now, expires: now + 60000, items: []
        }
      }
    })
    let dispatch = mock.method(store, 'dispatch')

    let { container } = render(<ActivityPane/>, withStore(store))
    fireEvent.click(container.querySelector('.activity.past .btn'))

    expect(dispatch.mock.calls[0].arguments[0])
      .to.eql(dismiss('item.import'))
  })

  it('shows the items of completed activities', () => {
    let now = Date.now()
    let record = (type, items) =>
      ({ type, id: 7, done: now, expires: now + 60000, items })
    let store = createStore({
      past: {
        'item.import': record('item.import', [1]),
        'tag.export': record('tag.export', [])
      }
    })
    let dispatch = mock.method(store, 'dispatch')

    let { container } = render(<ActivityPane/>, withStore(store))
    let [withItems, withoutItems] =
      container.querySelectorAll('.activity.past')

    fireEvent.click(withoutItems)
    expect(dispatch.mock.callCount()).to.equal(0)

    fireEvent.click(withItems)
    expect(dispatch.mock.calls[0].arguments[0].payload)
      .to.eql({ view: { name: 'activity', type: 'item.import', id: 7 } })
  })

  it('shows the items of busy activities', async () => {
    let store = createStore({
      busy: {
        1: activity(1, Date.now() - 1000),
        2: activity(2, Date.now() - 1000, { items: [3] })
      }
    })
    store.dispatch({
      type: 'nav.select',
      payload: { view: { name: 'activity', type: 'test', id: 2 } }
    })
    let dispatch = mock.method(store, 'dispatch')

    let { container } = render(<ActivityPane/>, withStore(store))
    await waitFor(() => {
      expect(container.querySelectorAll('.activity.busy')).to.have.length(2)
    })
    let [withItems, withoutItems] =
      container.querySelectorAll('.activity.busy')

    expect(withItems).to.have.class('active')
    expect(withoutItems).not.to.have.class('active')

    fireEvent.click(withoutItems)
    expect(dispatch.mock.callCount()).to.equal(0)

    fireEvent.click(withItems)
    expect(dispatch.mock.calls[0].arguments[0].payload)
      .to.eql({ view: { name: 'activity', type: 'test', id: 2 } })
  })

  it('dismisses without selecting', () => {
    let now = Date.now()
    let store = createStore({
      past: {
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
    fireEvent.click(container.querySelector('.activity.past .btn'))

    expect(dispatch.mock.callCount()).to.equal(1)
    expect(dispatch.mock.calls[0].arguments[0])
      .to.eql(dismiss('item.import'))
  })
})
