import React from 'react'
import { Input } from './input.js'


export class URLInput extends React.PureComponent {
  input = React.createRef()

  reset () {
    this.input.current?.reset()
  }

  render () {
    let { prefix, ...props } = this.props

    return (
      <div className="input-group">
        {prefix && (
          <div className="input-group-prepend">
            <div className="input-group-text">{prefix}</div>
          </div>
        )}
        <Input
          {...props}
          ref={this.input}
          type="text"
          noInputGroup/>
      </div>
    )
  }
}
