import { ref } from 'vue'

const apiKey = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY
const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID
const scope = 'https://www.googleapis.com/auth/calendar.events'

export const isGoogleCalendarConnected = ref(false)
export const googleCalendarError = ref('')

let accessToken = ''
let expiresAt = 0
let tokenClient
let identityScriptPromise

function loadIdentityScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-identity]')
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// Start loading before a user presses Connect/Add Task so the consent popup
// can still be opened directly from the user's click.
function prepareIdentityScript() {
  if (!identityScriptPromise) {
    identityScriptPromise = loadIdentityScript().catch((error) => {
      identityScriptPromise = null
      throw error
    })
  }
  return identityScriptPromise
}

prepareIdentityScript().catch(() => {})

export function hasValidGoogleCalendarConnection() {
  if (accessToken && Date.now() < expiresAt) return true
  if (accessToken) {
    accessToken = ''
    expiresAt = 0
    isGoogleCalendarConnected.value = false
  }
  return false
}

export function connectGoogleCalendar() {
  googleCalendarError.value = ''
  if (!clientId) {
    const error = new Error('Google OAuth client ID is not configured.')
    googleCalendarError.value = error.message
    return Promise.reject(error)
  }

  const requestToken = () => new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope,
      callback: (response) => {
        if (response.error) {
          const error = new Error(response.error_description || response.error)
          googleCalendarError.value = error.message
          reject(error)
          return
        }
        accessToken = response.access_token
        expiresAt = Date.now() + Number(response.expires_in || 3600) * 1000
        isGoogleCalendarConnected.value = true
        resolve(true)
      },
      error_callback: (response) => {
        const error = new Error(response.message || 'Google sign-in was cancelled.')
        googleCalendarError.value = error.message
        reject(error)
      },
    })
    tokenClient.requestAccessToken({ prompt: 'consent' })
  })

  if (window.google?.accounts?.oauth2) return requestToken()
  return prepareIdentityScript().then(requestToken)
}

function getToken() {
  if (!accessToken || Date.now() >= expiresAt) {
    accessToken = ''
    isGoogleCalendarConnected.value = false
    throw new Error('Connect Google Calendar again to sync events.')
  }
  return accessToken
}

export function disconnectGoogleCalendar() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken)
  }
  accessToken = ''
  expiresAt = 0
  isGoogleCalendarConnected.value = false
}

export function selectedGoogleCalendarId() {
  return localStorage.getItem('google-calendar-id')?.trim() || 'primary'
}

async function calendarRequest(method, calendarId, eventId, body) {
  const params = new URLSearchParams()
  if (apiKey) params.set('key', apiKey)
  const path = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events${eventId ? `/${encodeURIComponent(eventId)}` : ''}`
  const response = await fetch(`${path}${params.size ? `?${params}` : ''}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (response.status === 204) return null
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(result.error?.message || 'Google Calendar request failed.')
    error.status = response.status
    throw error
  }
  return result
}

function allDayBounds(date) {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(year, month - 1, day + 1)
  const endDate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
  return { start: { date }, end: { date: endDate } }
}

export async function loadGoogleEvents(start, end) {
  const calendarId = selectedGoogleCalendarId()
  const hasAccessToken = Boolean(accessToken && Date.now() < expiresAt)
  if (accessToken && !hasAccessToken) {
    accessToken = ''
    isGoogleCalendarConnected.value = false
  }
  const query = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
  })
  const params = new URLSearchParams(query)
  if (!hasAccessToken && apiKey) params.set('key', apiKey)
  const headers = hasAccessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers },
  )
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error?.message || 'Could not load Google Calendar events.')
  return (result.items || [])
    .filter((event) => event.status !== 'cancelled' && (event.start?.date || event.start?.dateTime))
    .map((event) => ({
      id: event.id,
      title: event.summary || '(Untitled event)',
      date: (event.start.dateTime || event.start.date).slice(0, 10),
      link: event.htmlLink,
    }))
}

export function createTaskCalendarEvent(task, calendarId = selectedGoogleCalendarId()) {
  if (!task.dueDate) return Promise.resolve(null)
  const eventId = task.id
    ? [...new TextEncoder().encode(`project-task:${task.id}`)]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
    : undefined
  return calendarRequest('POST', calendarId, null, {
    ...(eventId ? { id: eventId } : {}),
    summary: task.title,
    description: [task.description, task.id ? `Project task ID: ${task.id}` : '']
      .filter(Boolean)
      .join('\n\n'),
    ...allDayBounds(task.dueDate),
  }).catch(async (error) => {
    // The deterministic event ID makes retries safe if Calendar accepted the
    // insert but Firestore did not save the returned ID.
    if (eventId && /already exists|duplicate/i.test(error.message)) {
      return calendarRequest('GET', calendarId, eventId)
    }
    throw error
  })
}

export function updateTaskCalendarEvent(task, updates, calendarId = task.googleCalendarId || selectedGoogleCalendarId()) {
  if (!task.googleCalendarEventId) return Promise.resolve(null)
  const changes = {}
  if (updates.title !== undefined) changes.summary = updates.title
  if (updates.description !== undefined) changes.description = updates.description
  if (updates.dueDate !== undefined) {
    if (!updates.dueDate) return deleteTaskCalendarEvent(task)
    Object.assign(changes, allDayBounds(updates.dueDate))
  }
  if (!Object.keys(changes).length) return Promise.resolve(null)
  return calendarRequest('PATCH', calendarId, task.googleCalendarEventId, changes)
}

export function deleteTaskCalendarEvent(task) {
  if (!task.googleCalendarEventId) return Promise.resolve(null)
  return calendarRequest('DELETE', task.googleCalendarId || selectedGoogleCalendarId(), task.googleCalendarEventId)
    .catch((error) => {
      if (error.status === 404) return null
      throw error
    })
}
