import {
  createCompanyUpdate,
  findEmployeeById,
  listCompanyUpdates,
} from '../model/common/updates.model.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const CATEGORIES = ['announcements', 'notice_board', 'upcoming_events']

const canPublishUpdates = (role) => role === 'admin' || role === 'hr' || role === 'manager'

const ensureActor = async (actorId) => {
  const { data: actor, error } = await findEmployeeById(actorId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  if (!actor) {
    throw createHttpError('Authenticated user not found.', 401)
  }

  if (!actor.company_id) {
    throw createHttpError('Authenticated user company not found.', 400)
  }

  return actor
}

const normalizeCategory = (value) => {
  const category = String(value || '').trim().toLowerCase()

  if (!CATEGORIES.includes(category)) {
    throw createHttpError('Invalid update category.', 400)
  }

  return category
}

export const publishUpdate = async ({ actorId, payload }) => {
  const actor = await ensureActor(actorId)

  if (!canPublishUpdates(actor.role)) {
    throw createHttpError('Only admin, HR, or manager can publish updates.', 403)
  }

  const category = normalizeCategory(payload?.category)
  const title = String(payload?.title || '').trim()
  const content = String(payload?.content || '').trim()
  const isPinned = Boolean(payload?.is_pinned)
  const eventDateRaw = payload?.event_date ? String(payload.event_date).trim() : null

  if (!title || !content) {
    throw createHttpError('title and content are required.', 400)
  }

  if (category === 'upcoming_events' && !eventDateRaw) {
    throw createHttpError('event_date is required for upcoming events.', 400)
  }

  if (eventDateRaw) {
    const parsedDate = new Date(`${eventDateRaw}T00:00:00.000Z`)
    if (Number.isNaN(parsedDate.getTime())) {
      throw createHttpError('Invalid event_date.', 400)
    }
  }

  const { data, error } = await createCompanyUpdate({
    company_id: actor.company_id,
    category,
    title,
    content,
    event_date: eventDateRaw,
    is_pinned: isPinned,
    published_by_employee_id: actor.id,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data
}

export const getUpdates = async ({ actorId, category, limit }) => {
  const actor = await ensureActor(actorId)
  const normalizedCategory = category ? normalizeCategory(category) : null

  const normalizedLimit = limit ? Number(limit) : 50
  if (!Number.isInteger(normalizedLimit) || normalizedLimit < 1 || normalizedLimit > 200) {
    throw createHttpError('limit must be an integer between 1 and 200.', 400)
  }

  const { data, error } = await listCompanyUpdates({
    companyId: actor.company_id,
    category: normalizedCategory,
    limit: normalizedLimit,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data || []
}
