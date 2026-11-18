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

  describe('progress', () => {
    it('reports items as a copy, searching while shown', async () => {
      class ItemCommand extends Command {
        result = [1]
        get items () { return this.result }
      }

      let puts = []
      let cmd = new ItemCommand({ type: 'item.import', meta: { seq: 9 } })

      let run = (view) => runSaga({
        dispatch: (a) => puts.push(a),
        getState: () => ({ nav: { view } })
      }, function* () {
        yield * cmd.progress()
      }).toPromise()

      await run({ name: 'project' })
      cmd.result.push(2)
      await run({ name: 'activity', type: 'item.import', id: 9 })

      expect(puts.map(a => a.payload.items)).to.eql([[1], [1, 2]])
      expect(puts.map(a => a.meta.search)).to.eql([false, true])
    })
  })

  describe('addError', () => {
    it('collects errors of parallel items', async () => {
      let cmd = new Command({ type: 'test', meta: { seq: 1, silent: true } })

      await runSaga({ dispatch () {} }, function* () {
        yield * cmd.parallel([1, 2, 3], (item) => {
          if (item !== 2) throw new Error(`failed ${item}`)
        })
      }).toPromise()

      expect(cmd.errors.map(e => e.message))
        .to.eql(['failed 1', 'failed 3'])
    })
  })
})
