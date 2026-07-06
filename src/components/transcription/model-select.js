import { useIntl } from 'react-intl'
import { Select } from '../select.js'
import { Highlight } from '../completions.js'
import * as collate from '../../collate.js'

// TODO
export const MODELS = [
  { id: 579509, name: 'Text Titan II', languages: ['deu', 'eng', 'fin', 'fra', 'ita', 'lat', 'nld', 'por', 'swe'] },
  { id: 356425, name: 'The Text Titan I ter', languages: ['dan', 'deu', 'eng', 'fra', 'ita', 'nld', 'nor', 'pol', 'por', 'spa', 'swe'] },
  { id: 51170, name: 'The Text Titan I (Super Model)', languages: ['deu', 'eng', 'fin', 'fra', 'nld', 'swe'] },
  { id: 309753, name: 'Dutch Dean (Super Model)', languages: ['nld'] },
  { id: 309713, name: 'Dansk Dokumentalist (Super Model)', languages: ['dan'] },
  { id: 265149, name: 'German Genius (Super Model)', languages: ['deu'] },
  { id: 50786, name: 'The Dutchess I', languages: ['nld'] },
  { id: 50870, name: 'The German Giant I', languages: ['deu'] },
  { id: 37758, name: 'Transkribus French Model 1', languages: ['fra'] },
  { id: 39995, name: 'Transkribus Print M1', languages: ['ces', 'deu', 'eng', 'fin', 'fra', 'ita', 'lat', 'nld', 'pol', 'por', 'slk', 'slv', 'spa', 'swe'] },
  { id: 309593, name: 'The Text Titan I bis', languages: ['dan', 'deu', 'eng', 'fin', 'fra', 'lat', 'nld', 'nor', 'spa', 'swe'] },
  { id: 58997, name: 'Dutch Demeter I. (Super Model)', languages: ['nld'] },
  { id: 265029, name: 'English Elder (Super Model)', languages: ['eng'] },
  { id: 274829, name: 'Faucon Français', languages: ['fra'] },
  { id: 283749, name: 'Polski Bizon (Super Model)', languages: ['pol'] },
  { id: 37789, name: 'Transkribus Early Kurrent M1', languages: ['deu'] },
  { id: 38440, name: 'Transkribus Italian Handwriting M1', languages: ['ita'] },
  { id: 44976, name: 'Transkribus Polish M2', languages: ['pol'] },
  { id: 49901, name: 'Amsterdam Notarial Super Model', languages: ['deu', 'eng', 'fra', 'nld'] },
  { id: 53042, name: 'The English Eagle', languages: ['eng'] },
  { id: 53551, name: 'Coloso Español', languages: ['spa'] },
  { id: 223065, name: 'Spanish Sage (Super Model)', languages: ['spa'] },
  { id: 37855, name: 'Noscemus GM 5', languages: ['deu', 'grc', 'lat'] },
  { id: 35861, name: 'German Combined M1', languages: ['deu'] },
  { id: 55158, name: 'The Swedish Lion I', languages: ['swe'] },
]

export const ModelSelect = ({
  className = 'model-select',
  options = MODELS,
  placeholder,
  tabIndex = -1,
  ...props
}) => {
  let intl = useIntl()

  return (
    <Select
      {...props}
      className={className}
      match={matchModel}
      options={options}
      placeholder={placeholder && intl.formatMessage({ id: placeholder })}
      tabIndex={tabIndex}
      toText={renderModel}/>
  )
}

const renderModel = (model, { matchData } = {}) => (
  <>
    <span className="truncate">
      <Highlight text={model.name} matchData={matchData && matchData.name}/>
    </span>
    <span className="mute truncate">
      {model.languages.length ? model.languages.join(', ') : model.id}
    </span>
  </>
)

function matchModel (model, query) {
  let md = collate.match(model.name, query, /\b\w/g)

  if (md != null)
    return { name: md }

  for (let lang of model.languages) {
    if (collate.match(lang, query) != null)
      return {}
  }

  return null
}
