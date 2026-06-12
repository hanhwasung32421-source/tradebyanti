import { getSessionUser } from '../utils/auth'

export default defineEventHandler((event) => {
  const me = getSessionUser(event)
  return { me }
})

