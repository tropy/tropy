import { mock } from 'node:test'
import { act } from '@testing-library/react'
import { render } from '../support/react.js'
import { draggable } from '#tropy/components/dnd.js'
import { useExternalDrop } from '#tropy/hooks/use-external-drop.js'
import { hasPhotoFiles, hasProjectFiles } from '#tropy/components/dnd.js'

describe('useExternalDrop', () => {
  let Target = ({ name, children, canDrop: canDropData, onDrop = () => {} }) => {
    let [{ canDrop, isOver }, drop] = useExternalDrop({
      accept: hasPhotoFiles,
      canDrop: canDropData,
      onDrop
    })

    return (
      <div
        ref={drop}
        className={isOver ? `${name} over` : name}
        data-can-drop={canDrop}>
        {children}
      </div>
    )
  }

  let fire = (type, node, dataTransfer) => {
    let event = new DragEvent(type, {
      bubbles: true,
      cancelable: true,
      dataTransfer
    })
    act(() => { node.dispatchEvent(event) })
    return event
  }

  let files = (...types) => {
    let dataTransfer = new DataTransfer()
    for (let type of types)
      dataTransfer.items.add(new File([''], 'file', { type }))
    return dataTransfer
  }

  it('accepts and drops photo files', () => {
    let onDrop = mock.fn()
    let { container } = render(
      <div>
        <div className="outside"/>
        <Target name="target" onDrop={onDrop}/>
      </div>
    )
    let target = container.querySelector('.target')
    let outside = container.querySelector('.outside')
    let dataTransfer = files('image/jpeg')

    fire('dragenter', outside, dataTransfer)
    expect(target.dataset.canDrop).to.equal('true')
    expect(target).not.to.have.class('over')

    fire('dragenter', target, dataTransfer)
    fire('dragleave', outside, dataTransfer)
    expect(fire('dragover', target, dataTransfer).defaultPrevented).to.be.true
    expect(target).to.have.class('over')

    fire('drop', target, dataTransfer)
    expect(onDrop.mock.callCount()).to.equal(1)
    expect(target.dataset.canDrop).to.equal('false')
    expect(target).not.to.have.class('over')
  })

  it('refuses drags it does not accept', () => {
    let onDrop = mock.fn()
    let { container } = render(<Target name="target" onDrop={onDrop}/>)
    let target = container.querySelector('.target')
    let dataTransfer = files('application/vnd.tropy.tpy')

    fire('dragenter', target, dataTransfer)
    expect(target.dataset.canDrop).to.equal('false')
    expect(fire('dragover', target, dataTransfer).defaultPrevented).to.be.false

    fire('drop', target, dataTransfer)
    expect(onDrop.mock.callCount()).to.equal(0)
  })

  it('ignores the app’s own drags', () => {
    let { container } = render(
      <div>
        <div className="source">source</div>
        <Target name="target"/>
      </div>
    )
    let source = container.querySelector('.source')
    let target = container.querySelector('.target')
    let dataTransfer = files('image/jpeg')
    let cleanup = draggable({ element: source })

    fire('dragstart', source, dataTransfer)
    fire('dragenter', target, dataTransfer)
    expect(target.dataset.canDrop).to.equal('false')

    fire('dragend', source, dataTransfer)
    cleanup()
  })

  it('drops on the innermost target only', () => {
    let onOuterDrop = mock.fn()
    let onInnerDrop = mock.fn()
    let { container } = render(
      <Target name="outer" onDrop={onOuterDrop}>
        <Target name="inner" onDrop={onInnerDrop}/>
      </Target>
    )
    let inner = container.querySelector('.inner')
    let dataTransfer = files('image/jpeg')

    fire('dragenter', inner, dataTransfer)
    fire('drop', inner, dataTransfer)
    expect(onInnerDrop.mock.callCount()).to.equal(1)
    expect(onOuterDrop.mock.callCount()).to.equal(0)
  })

  it('passes drops the inner target refuses on', () => {
    let onOuterDrop = mock.fn()
    let onInnerDrop = mock.fn()
    let { container } = render(
      <Target name="outer" onDrop={onOuterDrop}>
        <Target name="inner" canDrop={() => false} onDrop={onInnerDrop}/>
      </Target>
    )
    let inner = container.querySelector('.inner')
    let dataTransfer = files('image/jpeg')

    fire('dragenter', inner, dataTransfer)
    fire('drop', inner, dataTransfer)
    expect(onInnerDrop.mock.callCount()).to.equal(0)
    expect(onOuterDrop.mock.callCount()).to.equal(1)
  })

  // Folders and .tropy projects look alike until dropped.
  it('counts unknown files as projects, not photos', () => {
    let items = [{ kind: 'file', type: 'image/jpeg' }, { kind: 'file', type: '' }]
    expect(hasProjectFiles(items)).to.be.true
    expect(hasPhotoFiles(items)).to.be.false
  })
})
