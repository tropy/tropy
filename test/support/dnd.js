import { wrapInTestContext } from 'react-dnd-test-utils'

export const wrap = (DecoratedComponent) =>
  wrapInTestContext((props) =>
    <DecoratedComponent {...props}/>)
