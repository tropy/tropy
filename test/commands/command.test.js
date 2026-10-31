import { runSaga } from 'redux-saga'
import { Command } from '#tropy/commands/command.js'
import { resume, suspend } from '#tropy/slices/activities.js'

describe('Command', () => {
  describe('dialog', () => {
    let run = (fn, ...args) => {
      let puts = []
      let cmd = new Command({ type: 'test', meta: { seq: 1 } })
      let task = runSaga({ dispatch: (a) => puts.push(a.type) }, function* () {
        return yield cmd.dialog(fn, ...args)
      })
      return { puts, task }
    }

    it('suspends the activity while the dialog is open', async () => {
      let { promise, resolve: close } = Promise.withResolvers()
      let { puts, task } = run(() => promise)

      expect(puts).to.eql([suspend.type])
      close('result')
      expect(await task.toPromise()).to.equal('result')
      expect(puts).to.eql([suspend.type, resume.type])
    })

    it('passes an abort signal in the trailing options', async () => {
      let args
      let dialog = (...rest) => { args = rest }

      await run(dialog, 'id', { detail: 'x' }).task.toPromise()
      expect(args[0]).to.equal('id')
      expect(args[1]).to.have.property('detail', 'x')
      expect(args[1].signal).to.be.an.instanceof(AbortSignal)

      await run(dialog, 'id').task.toPromise()
      expect(args[1].signal).to.be.an.instanceof(AbortSignal)
    })

    it('aborts the dialog when cancelled', () => {
      let signal
      let { puts, task } = run(({ signal: s }) => {
        signal = s
        return new Promise(() => {})
      })

      task.cancel()
      expect(signal.aborted).to.be.true
      expect(puts).to.eql([suspend.type, resume.type])
    })
  })
})
