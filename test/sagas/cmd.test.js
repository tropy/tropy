import { runSaga, stdChannel } from 'redux-saga'
import { delay } from 'redux-saga/effects'
import { Command } from '#tropy/commands/command.js'
import { cancel } from '#tropy/slices/activities.js'
import { exec } from '#tropy/sagas/cmd.js'
import { HISTORY } from '#tropy/constants/index.js'

class TestCommand extends Command {
  static last

  constructor (...args) {
    super(...args)
    TestCommand.last = this
  }

  *exec () {
    yield delay(1)

    if (this.action.payload === 'fail')
      throw new Error('failed')

    if (this.action.payload === 'wait')
      yield delay(1000)

    if (this.action.payload === 'edit')
      this.undo = { type: 'test.cmd', payload: 'edit', meta: {} }

    if (this.action.payload === 'partial') {
      this.addError(new Error('part 1'))
      this.addError(new Error('part 2'))
    }

    return 'result'
  }

  *abort () {
    yield delay(0)
    this.aborted = true
  }
}

TestCommand.register('test.cmd')

describe('*exec', () => {
  let run = (payload, meta) => {
    let channel = stdChannel()
    let puts = []

    let action = {
      type: 'test.cmd',
      payload,
      meta: { seq: 42, now: Date.now(), silent: true, ...meta }
    }

    let task = runSaga({
      channel,
      dispatch (a) {
        puts.push(a)
        channel.put(a)
      }
    }, exec, {}, action)

    let done = () => puts.find(a => a.meta?.done)
    let tick = () => puts.find(a => a.type === HISTORY.TICK)

    return { channel, done, tick, task }
  }

  it('finishes successful commands', async () => {
    let { done, task } = run()
    await task.toPromise()

    let cmd = TestCommand.last
    expect(cmd.result).to.equal('result')
    expect(cmd.cancelled).not.to.be.ok
    expect(Object.isFrozen(cmd)).to.be.true
    expect(done()).to.have.property('payload', 'result')
  })

  it('finishes partly failed commands as successful', async () => {
    let { done, task } = run('partial')
    await task.toPromise()

    let cmd = TestCommand.last
    expect(cmd.error).to.be.undefined
    expect(cmd.aborted).not.to.be.ok
    expect(done()).to.have.property('error', false)
    expect(done()).to.have.property('payload', 'result')
    expect(done().meta.errors).to.equal(2)
  })

  it('finishes failed commands as failed, not cancelled', async () => {
    let { done, task } = run('fail')
    await task.toPromise()

    let cmd = TestCommand.last
    expect(task.isCancelled()).to.be.false
    expect(cmd.error).to.have.property('message', 'failed')
    expect(cmd.aborted).to.be.true
    expect(cmd.cancelled).not.to.be.ok
    expect(Object.isFrozen(cmd)).to.be.true
    expect(done()).to.have.property('error', true)
    expect(done().meta.cancelled).to.be.undefined
  })

  it('adds edits to the history, redo by their agent', async () => {
    let { done, tick, task } = run('edit', { history: 'add', agent: 'A' })
    await task.toPromise()

    let { undo, redo } = tick().payload
    expect(done().meta).to.include({ history: 'add', agent: 'A' })
    expect(redo.meta).to.include({ history: 'redo', agent: 'A' })
    expect(undo.meta).to.include({ history: 'undo' })
    expect(undo.meta).not.to.have.property('agent')
  })

  it('does not add undo or redo to the history', async () => {
    let { done, tick, task } = run('edit', { history: 'undo' })
    await task.toPromise()

    expect(tick()).to.be.undefined
    expect(done().meta).to.include({ history: 'undo' })
  })

  it('finishes commands cancelled from outside as cancelled', async () => {
    let { channel, done, task } = run('wait')
    await new Promise(resolve => setTimeout(resolve, 20))
    channel.put(cancel(42))
    await task.toPromise()

    let cmd = TestCommand.last
    expect(cmd.cancelled).to.be.true
    expect(cmd.aborted).not.to.be.ok
    expect(cmd.error).to.be.undefined
    expect(Object.isFrozen(cmd)).to.be.true
    expect(done().meta.cancelled).to.be.true
  })
})
