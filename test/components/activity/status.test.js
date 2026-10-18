import { waitFor } from '@testing-library/react'
import { render, createStore, withStore } from '../../support/react.js'
import { ActivityStatus } from '#tropy/components/activity/index.js'

const busy = (id, props) => ({
  id, init: Date.now() - 1000, type: 'test', ...props
})

const renderStatus = async (...activities) => {
  let store = createStore({
    activities: Object.fromEntries(activities.map(a => [a.id, a]))
  })
  let { container } = render(<ActivityStatus/>, withStore(store))

  if (activities.length > 0) {
    await waitFor(() => {
      expect(container.querySelector('.icon')).to.exist
    })
  }

  return container.querySelector('.icon')
}

describe('ActivityStatus', () => {
  it('renders nothing without busy activities', async () => {
    expect(await renderStatus()).to.be.null
  })

  it('renders indeterminate status for a single activity', async () => {
    let icon = await renderStatus(busy(1))
    expect(icon).to.have.class('icon-status')
    expect(icon.style.getPropertyValue('--indeterminate')).to.equal('true')
  })

  it('renders progress for a single activity', async () => {
    let icon = await renderStatus(busy(1, { progress: 2, total: 4 }))
    expect(icon).to.have.class('icon-status')
    expect(icon.style.getPropertyValue('--progress')).to.equal('25')
    expect(icon.style.getPropertyValue('--indeterminate')).to.equal('')
  })

  it('renders the activity message as title', async () => {
    let icon = await renderStatus(
      busy(1, { type: 'item.import', progress: 2, total: 5 }))
    expect(icon).to.have.attribute('title', 'Importing item 2 of 5 …')
  })

  it('renders the activity status icon', async () => {
    let icon = await renderStatus(
      busy(1, { statusIcon: 'TranscriptionStatus' }))
    expect(icon).to.have.class('icon-transcription-status')
  })

  it('renders indeterminate status for multiple activities', async () => {
    let icon = await renderStatus(
      busy(1, { statusIcon: 'TranscriptionStatus', progress: 1, total: 4 }),
      busy(2))
    expect(icon).to.have.class('icon-status')
    expect(icon.style.getPropertyValue('--indeterminate')).to.equal('true')
    expect(icon).to.have.attribute('title', '2 activities in progress …')
  })
})
