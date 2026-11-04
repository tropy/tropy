import { FilterControls } from './filter.js'
import { Button, ButtonContainer } from '../button.js'
import { shallow } from '../../common/util.js'
import { FILTERS } from '../../esper/photo.js'
import { TABS } from '../../constants/index.js'

export const EsperPanel = ({
  hasKeystone,
  horizontal,
  isDisabled,
  isKeystoneVisible,
  isVisible,
  keystone,
  onChange,
  onKeystoneAdjust,
  onKeystoneToggle,
  onRevert,
  rotate,
  vertical,
  ...props
}) => {
  let isPristine = shallow(FILTERS, props) && keystone == null

  return (
    <div className="esper-panel">
      <FilterControls
        hasKeystone={hasKeystone}
        isDisabled={isDisabled || !isVisible}
        isKeystoneVisible={isKeystoneVisible}
        {...props}
        horizontal={horizontal}
        rotate={rotate}
        vertical={vertical}
        onChange={onChange}
        onKeystoneAdjust={onKeystoneAdjust}
        onKeystoneToggle={onKeystoneToggle}/>

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
