import { FormattedMessage, useIntl } from 'react-intl'
import { useEvent } from '../../hooks/use-event.js'
import { Button } from '../button.js'
import {
  IconDotsVertical,
  IconMaze,
  IconRemoveLink,
  IconWarningSm
} from '../icons.js'
import { RelativeDate } from '../date.js'


export const ProjectFileList = ({
  files,
  onConsolidate,
  onContextMenu,
  onSelect
}) => (
  <ol className="project-files">
    {files.map(({ name, path, hasConflict, ...stats }) => (
      <ProjectFile
        key={path}
        name={name}
        hasConflict={hasConflict}
        onClick={onSelect}
        onConsolidate={onConsolidate}
        onContextMenu={onContextMenu}
        path={path}
        stats={stats}/>
    )
    )}
  </ol>
)

export const ProjectFile = ({
  name,
  onClick,
  onConsolidate,
  onContextMenu,
  path,
  hasConflict,
  stats
}) => {
  let intl = useIntl()

  let isMissing = !stats?.lastModified

  let handleClick = useEvent(() => {
    if (isMissing && onConsolidate)
      onConsolidate(path)
    else
      onClick?.(path)
  })

  let handleContextMenu = useEvent((event) => {
    event.stopPropagation()
    onContextMenu?.(event, { path, isMissing })
  })

  let hint = intl.formatMessage({
    id: `project.file.${isMissing ? 'missing' : 'open'}`
  }, { path })

  return (
    <li
      className="project-file"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={hint}>
      <IconMaze/>
      <div className="flex-col">
        <div className="name">
          <div className="truncate">{name}</div>
          {hasConflict && (
            <IconRemoveLink
              title={intl.formatMessage({ id: 'project.file.conflict' })}/>
          )}
          {isMissing && <IconWarningSm/>}
        </div>
        <ProjectFileStats {...stats}/>
      </div>
      <Button
        className="context"
        icon={<IconDotsVertical/>}
        onClick={handleContextMenu}
        title="project.file.options"/>
    </li>
  )
}

export const ProjectFileStats = ({ lastModified, ...values }) =>
  (lastModified != null) && (
    <ul className="stats">
      <li>
        <RelativeDate value={lastModified}/>
      </li>
      <li>
        <FormattedMessage id="project.stats.items" values={values}/>
      </li>
      <li>
        <FormattedMessage id="project.stats.photos" values={values}/>
      </li>
      <li>
        <FormattedMessage id="project.stats.notes" values={values}/>
      </li>
    </ul>
  )
