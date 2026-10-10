import fs from 'node:fs'
import { run } from '../../support/saga.js'
import { Export } from '#tropy/commands/transcription/export.js'
import * as slice from '#tropy/slices/transcriptions.js'
import { copy } from '#tropy/clipboard.js'
import { save } from '#tropy/dialog.js'

describe('Export transcription', () => {
  let alto = { text: 'Text', data: '<alto/>' }
  let text = { text: 'Text' }
  let { writeFile } = fs.promises

  let exec = (tr, meta, saveAs) => run(
    new Export(slice.export(1, meta)).exec(), {
      state: { transcriptions: { 1: tr } },
      mocks: [[save.transcription, () => saveAs]]
    })

  let args = ({ calls }) => calls.map(c => c.arguments)

  it('prompts for a target offering ALTO', () => {
    expect(args(exec(alto).calls(save.transcription)))
      .to.eql([[{ alto: true }]])
  })

  it('prompts for a target without ALTO if there is none', () => {
    expect(args(exec(text).calls(save.transcription)))
      .to.eql([[{ alto: false }]])
  })

  it('writes to the chosen target', () => {
    expect(args(exec(alto, {}, 'a.xml').calls(writeFile)))
      .to.eql([['a.xml', '<alto/>']])
  })

  it('writes nothing if the prompt is cancelled', () => {
    expect(exec(alto).calls(writeFile).callCount()).to.equal(0)
  })

  it('exports ALTO to .xml without prompting', () => {
    let t = exec(alto, { target: 'a.xml' })
    expect(t.calls(save.transcription).callCount()).to.equal(0)
    expect(args(t.calls(writeFile))).to.eql([['a.xml', '<alto/>']])
  })

  it('exports text to other files', () => {
    expect(args(exec(alto, { target: 'a.txt' }).calls(writeFile)))
      .to.eql([['a.txt', 'Text']])
  })

  it('falls back to text if there is no ALTO', () => {
    expect(args(exec(text, { target: 'a.xml' }).calls(writeFile)))
      .to.eql([['a.xml', 'Text']])
  })

  it('copies ALTO to the clipboard', () => {
    let t = exec(alto, { target: ':clipboard:', format: 'alto' })
    expect(args(t.calls(copy))).to.eql([[{ text: '<alto/>' }]])
  })
})
