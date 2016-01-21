'use strict'

const React = require('react')
const ReactDOM = require('react-dom')

class Assistant extends React.Component {
  render() {
    return (
      <div className="assistant">
        {this.props.children}
      </div>
    )
  }
}

module.exports = {
  mount(node) { ReactDOM.render(<Assistant/>, node) },

  Assistant
}
