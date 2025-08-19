export const RoleBasedAccessCheck = (requiredActions) => {
  const requiredActionsParsed = JSON.parse(requiredActions)
  const actions = localStorage.getItem('actions')
  const parsedActions = JSON.parse(actions)

  const hasAccess = requiredActionsParsed.some((i) => parsedActions.includes(i))
  return hasAccess || parsedActions.includes('Administrator')
}
