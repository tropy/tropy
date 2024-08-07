import React from 'react'
import { FilterControls } from './filter.js'
import { Button, ButtonContainer } from '../button.js'
import { shallow } from '../../common/util.js'
import { FILTERS } from '../../esper/photo.js'
import { TABS } from '../../constants/index.js'

export const EsperPanel = ({
  isDisabled,
  isVisible,
  onChange,
  onRevert,
  ...props
}) => {
  let isPristine = shallow(FILTERS, props)

  return (
    <div className="esper-panel">
      <FilterControls
        isDisabled={isDisabled || !isVisible}
        {...props}
        onChange={onChange}/>

      <ButtonContainer className="revert">
        <Button
          isBlock
          isDefault
          isDisabled={isDisabled || isPristine || !isVisible}
          tabIndex={TABS.EsperPanel}
          text="esper.panel.revert"
          onClick={onRevert}/>
      </ButtonContainer>
    </div>
  )
}
