import fs from 'node:fs'
import { run } from '../../support/saga.js'
import { Command } from '#tropy/commands/command.js'
import { Export } from '#tropy/commands/transcription/export.js'
import * as slice from '#tropy/slices/transcriptions.js'
import { copy } from '#tropy/clipboard.js'
import { save } from '#tropy/dialog.js'

describe('Export transcription', () => {
  let alto = { text: 'Text', data: '<alto/>' }
  let text = { text: 'Text' }
  let { writeFile } = fs.promises
  let { showDialog: dialog } = Command.prototype

  let exec = (tr, meta, saveAs, copyFormat = 'text') => run(
    new Export(slice.export(1, meta)).exec(), {
      state: {
        transcriptions: { 1: tr },
        settings: { export: { transcription: { copyFormat } } }
      },
      mocks: [[dialog, () => saveAs]]
    })

  let args = ({ calls }) => calls.map(c => c.arguments)

  it('prompts for a target offering ALTO if available', () => {
    expect(args(exec(alto).calls(dialog)))
      .to.eql([[save.transcription, { alto: true }]])
    expect(args(exec(text).calls(dialog)))
      .to.eql([[save.transcription, { alto: false }]])
  })

  it('writes to the chosen target, if any', () => {
    expect(args(exec(alto, {}, 'a.xml').calls(writeFile)))
      .to.eql([['a.xml', '<alto/>']])
    expect(exec(alto).calls(writeFile).callCount()).to.equal(0)
  })

  it('writes ALTO to .xml and text otherwise', () => {
    let write = (tr, target) => args(exec(tr, { target }).calls(writeFile))

    expect(write(alto, 'a.xml')).to.eql([['a.xml', '<alto/>']])
    expect(write(alto, 'a.txt')).to.eql([['a.txt', 'Text']])
    expect(write(text, 'a.xml')).to.eql([['a.xml', 'Text']])
  })

  it('copies the preferred format, if available', () => {
    let copied = (tr, format) =>
      args(exec(tr, { target: ':clipboard:' }, null, format).calls(copy))

    expect(copied(alto, 'text')).to.eql([[{ text: 'Text' }]])
    expect(copied(alto, 'alto')).to.eql([[{ text: '<alto/>' }]])
    expect(copied(text, 'alto')).to.eql([[{ text: 'Text' }]])
  })
})
