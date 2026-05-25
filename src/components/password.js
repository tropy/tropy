import { useState } from 'react'
import { Button } from './button.js'

export const Password = (props) => {
  let [isVisible, setVisibility] = useState(false)

  return (
    <div className="input-group">
      <input
        {...props}
        type={isVisible ? 'text' : 'password'}/>
      <Button
        title={`password.${isVisible ? 'hide' : 'reveal'}`}
        icon={isVisible ? 'IconMaze' : 'IconGhost'}
        disabled={props?.disabled}
        onClick={() => setVisibility(!isVisible)}/>
    </div>
  )
}
