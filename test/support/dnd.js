'use strict'

const React = require('react')
const TestBackend = require('react-dnd-test-backend')
const { DragDropContext } = require('react-dnd')

function wrap(DecoratedComponent) {
  return DragDropContext(TestBackend)(
    // eslint-disable-next-line react/prefer-stateless-function
    class TestContextContainer extends React.Component {
      render() {
        return <DecoratedComponent {...this.props}/>
      }
    }
  )
}

module.exports = {
  wrap
}
