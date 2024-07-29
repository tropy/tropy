import React from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { useEvent } from '../../hooks/use-event.js'
import { Button } from '../button.js'
import { IconMaze, IconWarningSm, IconXMedium } from '../icons.js'
import { RelativeDate } from '../date.js'


export const ProjectFileList = ({
  files,
  onConsolidate,
  onRemove,
  onSelect
}) => (
  <ol className="project-files">
    {files.map(({ name, path, ...stats }) => (
      <ProjectFile
        key={path}
        name={name}
        onClick={onSelect}
        onConsolidate={onConsolidate}
        onRemove={onRemove}
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
  onRemove,
  path,
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

  let handleRemove = useEvent((event) => {
    event.stopPropagation()
    onRemove?.(path)
  })

  let hint = intl.formatMessage({
    id: `project.file.${isMissing ? 'missing' : 'open'}`
  }, { path })

  return (
    <li
      className="project-file"
      onClick={handleClick}
      title={hint}>
      <IconMaze/>
      <div className="flex-col">
        <div className="name">
          <div className="truncate">{name}</div>
          {isMissing && <IconWarningSm/>}
        </div>
        <ProjectFileStats {...stats}/>
      </div>
      <Button
        icon={<IconXMedium/>}
        onClick={handleRemove}
        title="project.file.remove"/>
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
