import { mock } from 'node:test'
import { render, createStore, withStore } from '../../support/react.js'
import { ProjectView } from '#tropy/components/project/view.js'
import { ITEM } from '#tropy/constants/index.js'

describe('ProjectView', () => {
  const paste = (data) => {
    let event = new Event('paste', { bubbles: true, cancelable: true })
    event.clipboardData = {
      types: ['application/json'],
      getData: () => JSON.stringify(data)
    }
    window.dispatchEvent(event)
  }

  const imports = (shown) => {
    let { lists, ontology } = F.state
    let intl = { locale: 'en', messages: {} }
    let store = createStore({ intl, lists, ontology })
    store.dispatch({ type: 'nav.select', payload: { view: shown } })

    let dispatch = mock.method(store, 'dispatch')
    render(
      <ProjectView project={F.state.projects.tropy} offset={0}/>,
      withStore(store))

    paste({ '@graph': [] })

    return dispatch.mock.calls
      .map(call => call.arguments[0])
      .filter(action => action?.type === ITEM.IMPORT)
      .map(action => action.payload.list)
  }

  it('imports into the selected list', () => {
    expect(imports({ name: 'list', id: 3 })).to.eql([3])
  })

  it('imports into no list in other views', () => {
    expect(imports({ name: 'project' })).to.eql([null])
    expect(imports({ name: 'unlisted' })).to.eql([null])
  })
})
