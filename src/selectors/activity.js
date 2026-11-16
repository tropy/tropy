import { createSelector as memo } from '@reduxjs/toolkit'


export const getActivities = memo(
  ({ activities }) => activities,
  (activities) =>
    Object.values(activities).filter(a => !a.done && !a.hidden)
)
