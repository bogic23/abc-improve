import { ref } from 'vue'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3/calendars'
const CALENDAR_ID_KEY = 'google-calendar-id'

const API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID

export const googleCalendarError = ref('')
export const isGoogleCalendarConnected = ref(false)

let gisPromise = null
let connectPromise = null
let tokenClient = null
let accessToken = ''
let tokenExpiresAt = 0

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisPromise) return gisPromise

  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-identity]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Could not load Google services.')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Google services.'))
    document.head.appendChild(script)
  }).catch((error) => {
    gisPromise = null
    throw error
  })

  return gisPromise
}

export function preloadCalendar() {
  if (!CLIENT_ID) return Promise.resolve()
  return loadGis().catch(() => {})
}

function clearToken() {
  accessToken = ''
  tokenExpiresAt = 0
  isGoogleCalendarConnected.value = false
}

export function hasValidGoogleCalendarConnection() {
  if (accessToken && Date.now() < tokenExpiresAt) return true
  if (accessToken) clearToken()
  return false
}

export function connectGoogleCalendar() {
  if (!CLIENT_ID) {
    const message = 'Google Calendar is not configured.'
    googleCalendarError.value = message
    return Promise.reject(new Error(message))
  }
  if (connectPromise) return connectPromise

  googleCalendarError.value = ''

  const request = () =>
    new Promise((resolve, reject) => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: CALENDAR_SCOPE,
        callback: (response) => {
          if (response.error) {
            const message =
              response.error_description || 'Google Calendar access was not granted.'
            googleCalendarError.value = message
            reject(new Error(message))
            return
          }
          accessToken = response.access_token
          tokenExpiresAt = Date.now() + Number(response.expires_in || 3600) * 1000
          isGoogleCalendarConnected.value = true
          googleCalendarError.value = ''
          resolve(true)
        },
        error_callback: (error) => {
          const message = error?.message || 'Google Calendar sign-in was cancelled.'
          googleCalendarError.value = message
          reject(new Error(message))
        },
      })
      tokenClient.requestAccessToken({ prompt: 'consent' })
    })

  connectPromise = (window.google?.accounts?.oauth2 ? Promise.resolve() : loadGis())
    .then(request)
    .finally(() => {
      connectPromise = null
    })

  return connectPromise
}

export function disconnectGoogleCalendar() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken)
  }
  clearToken()
  googleCalendarError.value = ''
}

export function selectedGoogleCalendarId() {
  const stored = localStorage.getItem(CALENDAR_ID_KEY)?.trim()
  return stored || 'primary'
}

function requireToken() {
  if (!hasValidGoogleCalendarConnection()) {
    throw new Error('Connect Google Calendar again to sync events.')
  }
  return accessToken
}

function calendarUrl(calendarId, eventId) {
  const base = `${CALENDAR_BASE}/${encodeURIComponent(calendarId)}/events`
  return eventId ? `${base}/${encodeURIComponent(eventId)}` : base
}

async function readError(response) {
  const data = await response.json().catch(() => ({}))
  const error = new Error(
    data?.error?.message || `Google Calendar request failed (${response.status}).`,
  )
  error.status = response.status
  return error
}

async function calendarRequest(method, calendarId, eventId, body) {
  const response = await fetch(calendarUrl(calendarId, eventId), {
    method,
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (response.status === 401) clearToken()
  if (response.status === 204) return null
  if (!response.ok) throw await readError(response)
  return response.json()
}

function nextDay(date) {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + 1)
  return value.toISOString().slice(0, 10)
}

function eventPayload(task, date = task.dueDate) {
  return {
    summary: task.title,
    description: [
      task.description,
      task.id ? `Project task ID: ${task.id}` : '',
      'Managed with PulsePM',
    ]
      .filter(Boolean)
      .join('\n\n'),
    start: { date },
    end: { date: nextDay(date) },
    extendedProperties: {
      private: {
        pulseTaskId: task.id || '',
        pulseProjectId: task.projectId || '',
      },
    },
    reminders: { useDefault: true },
  }
}

function eventIdForTask(taskId) {
  return [...new TextEncoder().encode(`project-task:${taskId}`)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function createTaskCalendarEvent(task, calendarId = selectedGoogleCalendarId()) {
  if (!task.dueDate) return null

  const payload = eventPayload(task)
  if (task.id) payload.id = eventIdForTask(task.id)

  try {
    const event = await calendarRequest('POST', calendarId, null, payload)
    return event ? { ...event, calendarId } : null
  } catch (error) {
    if (payload.id && /already exists|duplicate/i.test(error.message)) {
      const existing = await calendarRequest('GET', calendarId, payload.id)
      return {
        ...existing,
        id: existing?.id || payload.id,
        calendarId,
      }
    }
    throw error
  }
}

export async function updateTaskCalendarEvent(task, date = task.dueDate) {
  if (!date) return null

  const calendarId = task.googleCalendarId || selectedGoogleCalendarId()
  if (!task.googleCalendarEventId) {
    return createTaskCalendarEvent({ ...task, dueDate: date }, calendarId)
  }

  try {
    const event = await calendarRequest(
      'PATCH',
      calendarId,
      task.googleCalendarEventId,
      eventPayload({ ...task, dueDate: date }, date),
    )
    return {
      ...event,
      id: event?.id || task.googleCalendarEventId,
      calendarId,
    }
  } catch (error) {
    if (error.status === 404) {
      return createTaskCalendarEvent({ ...task, dueDate: date }, calendarId)
    }
    throw error
  }
}

export async function deleteTaskCalendarEvent(task) {
  if (!task.googleCalendarEventId) return null

  const calendarId = task.googleCalendarId || selectedGoogleCalendarId()
  try {
    await calendarRequest('DELETE', calendarId, task.googleCalendarEventId)
    return true
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }
}

export async function loadGoogleEvents(timeMin, timeMax) {
  const calendarId = selectedGoogleCalendarId()
  const connected = hasValidGoogleCalendarConnection()
  if (!connected && !API_KEY) return []

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
  })
  if (!connected) params.set('key', API_KEY)

  const response = await fetch(`${calendarUrl(calendarId)}?${params}`, {
    headers: connected ? { Authorization: `Bearer ${accessToken}` } : {},
  })

  if (response.status === 401) clearToken()
  if (!response.ok) throw await readError(response)

  const data = await response.json().catch(() => ({}))
  return (data.items || [])
    .filter((event) => event.status !== 'cancelled' && (event.start?.date || event.start?.dateTime))
    .map((event) => ({
      id: event.id,
      title: event.summary || '(Untitled event)',
      date: (event.start.dateTime || event.start.date).slice(0, 10),
      link: event.htmlLink,
    }))
}

preloadCalendar()
