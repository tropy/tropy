import { join } from 'node:path'
import '../../support/fixtures.js'

describe('Smoke Tests', () => {
  let userData

  before(async () => {
    userData = await browser.electron.execute(
      (electron) => electron.app.getPath('userData')
    )
  })

  describe('First Start', () => {
    it('shows the new project screen', async () => {
      let noProject = await $('.no-project')
      await expect(noProject).toBeDisplayed({ wait: 15000 })

      let newProject = await $('.new-project')
      await expect(newProject).toBeDisplayed()
    })
  })

  describe('Create Project', () => {
    let filePath

    before(async () => {
      filePath = join(userData, '..', 'alpha.tropy')

      let showSaveDialog =
        await browser.electron.mock('dialog', 'showSaveDialog')

      await showSaveDialog.mockResolvedValue({
        filePath,
        canceled: false
      })
    })

    after(async () => {
      await browser.electron.restoreAllMocks()
    })

    it('creates and opens a project', async () => {
      let nameInput = await $('.new-project input.form-control')
      await nameInput.setValue('Alpha')

      let createBtn = await $('.new-project button[type="submit"]')
      await createBtn.click()

      let project = await $('.project:not(.closed)')
      await expect(project).toBeDisplayed({ wait: 15000 })
    })
  })

  describe('Import a Photo', () => {
    before(async () => {
      let showOpenDialog =
        await browser.electron.mock('dialog', 'showOpenDialog')

      await showOpenDialog.mockResolvedValue({
        filePaths: [F.image.path('PA140105.JPG')],
        canceled: false
      })
    })

    after(async () => {
      await browser.electron.restoreAllMocks()
    })

    it('imports a photo via menu command', async () => {
      await browser.electron.execute((electron) => {
        electron.Menu.getApplicationMenu()
          .getMenuItemById('import')
          .submenu.items[0]
          .click()
      })

      let item = await $('.item-table .item .editable')
      await expect(item).toBeDisplayed({ wait: 15000 })
      await expect(item).toHaveText('PA140105')
    })
  })
})
