import {
  createConversationRecord,
  createMessageRecord,
  findConversationById,
  findMessageById,
  findConversationByParticipantPair,
  findEmployeeById,
  listCompanyEmployees,
  listConversationsForEmployee,
  listMessagesByConversationId,
  markMessageDeliveredById,
  markMessageReadById,
  listUnreadConversationMessages,
  markConversationMessagesDelivered,
  markConversationMessagesRead,
  markConversationSetDelivered,
  listProfileDetailsByEmployeeIds,
  updateConversationTimestamp,
} from '../model/common/chat.model.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

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

const buildProfilePictureMap = async (employeeIds) => {
  const { data, error } = await listProfileDetailsByEmployeeIds(employeeIds)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return new Map((data || []).map((row) => [row.employee_id, row.personal_details?.profile_picture_url || null]))
}

const sortParticipantPair = (employeeIdA, employeeIdB) => {
  return [employeeIdA, employeeIdB].sort((a, b) => a.localeCompare(b))
}

const ensureConversationAccess = (conversation, actorId) => {
  if (!conversation) {
    throw createHttpError('Conversation not found.', 404)
  }

  const isParticipant =
    conversation.participant_a_employee_id === actorId || conversation.participant_b_employee_id === actorId

  if (!isParticipant) {
    throw createHttpError('You do not have access to this conversation.', 403)
  }
}

const computeMessageStatus = ({ message, actorId }) => {
  if (message.sender_employee_id !== actorId) {
    return null
  }

  if (message.read_at) {
    return 'read'
  }

  if (message.delivered_at) {
    return 'delivered'
  }

  return 'sent'
}

export const listChatContacts = async ({ actorId }) => {
  const actor = await ensureActor(actorId)
  const { data: employees, error } = await listCompanyEmployees({
    companyId: actor.company_id,
    excludeEmployeeId: actorId,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const rows = employees || []
  const profileMap = await buildProfilePictureMap(rows.map((row) => row.id))

  return rows.map((row) => ({
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    role: row.role,
    profile_picture_url: profileMap.get(row.id) || null,
  }))
}

export const listMyConversations = async ({ actorId }) => {
  const actor = await ensureActor(actorId)

  const { data: conversations, error } = await listConversationsForEmployee({ employeeId: actorId })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const rows = conversations || []
  const conversationIds = rows.map((row) => row.id)

  const now = new Date().toISOString()
  const { error: deliveredError } = await markConversationSetDelivered({
    conversationIds,
    recipientEmployeeId: actorId,
    deliveredAt: now,
  })

  if (deliveredError) {
    throw createHttpError(deliveredError.message, 500)
  }

  const { data: unreadRows, error: unreadError } = await listUnreadConversationMessages({
    conversationIds,
    recipientEmployeeId: actorId,
  })

  if (unreadError) {
    throw createHttpError(unreadError.message, 500)
  }

  const unreadCountMap = new Map()
  ;(unreadRows || []).forEach((row) => {
    unreadCountMap.set(row.conversation_id, (unreadCountMap.get(row.conversation_id) || 0) + 1)
  })

  const counterpartIds = rows.map((row) =>
    row.participant_a_employee_id === actorId ? row.participant_b_employee_id : row.participant_a_employee_id
  )

  const uniqueCounterpartIds = [...new Set(counterpartIds.filter(Boolean))]
  const counterpartResults = await Promise.all(uniqueCounterpartIds.map((id) => findEmployeeById(id)))

  const counterpartMap = new Map()
  counterpartResults.forEach((result) => {
    if (result.error || !result.data) {
      return
    }
    counterpartMap.set(result.data.id, result.data)
  })

  const profileMap = await buildProfilePictureMap(uniqueCounterpartIds)
  const messageResults = await Promise.all(
    rows.map((conversation) => listMessagesByConversationId({ conversationId: conversation.id, limit: 1 }))
  )

  return rows.map((conversation, index) => {
    const counterpartId =
      conversation.participant_a_employee_id === actorId
        ? conversation.participant_b_employee_id
        : conversation.participant_a_employee_id

    const counterpart = counterpartMap.get(counterpartId) || null
    const latestMessageData = messageResults[index]?.data || []
    const latestMessage = latestMessageData.length ? latestMessageData[0] : null

    return {
      id: conversation.id,
      last_message_at: conversation.last_message_at,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      latest_message: latestMessage
        ? {
            id: latestMessage.id,
            content: latestMessage.content,
            sender_employee_id: latestMessage.sender_employee_id,
            status: computeMessageStatus({ message: latestMessage, actorId }),
            created_at: latestMessage.created_at,
          }
        : null,
      unread_count: unreadCountMap.get(conversation.id) || 0,
      counterpart: counterpart
        ? {
            id: counterpart.id,
            first_name: counterpart.first_name,
            last_name: counterpart.last_name,
            email: counterpart.email,
            role: counterpart.role,
            profile_picture_url: profileMap.get(counterpart.id) || null,
          }
        : null,
    }
  })
}

export const createOrGetConversation = async ({ actorId, participantEmployeeId }) => {
  const actor = await ensureActor(actorId)

  if (!participantEmployeeId) {
    throw createHttpError('participant_employee_id is required.', 400)
  }

  if (participantEmployeeId === actorId) {
    throw createHttpError('Cannot start a conversation with yourself.', 400)
  }

  const { data: participant, error: participantError } = await findEmployeeById(participantEmployeeId)

  if (participantError) {
    throw createHttpError(participantError.message, 500)
  }

  if (!participant || participant.company_id !== actor.company_id) {
    throw createHttpError('Target participant not found in your company.', 404)
  }

  const [participantAEmployeeId, participantBEmployeeId] = sortParticipantPair(actorId, participantEmployeeId)

  const { data: existingConversation, error: existingError } = await findConversationByParticipantPair({
    participantAEmployeeId,
    participantBEmployeeId,
  })

  if (existingError) {
    throw createHttpError(existingError.message, 500)
  }

  if (existingConversation) {
    return existingConversation
  }

  const { data: createdConversation, error: createError } = await createConversationRecord({
    company_id: actor.company_id,
    participant_a_employee_id: participantAEmployeeId,
    participant_b_employee_id: participantBEmployeeId,
    created_by_employee_id: actorId,
    last_message_at: null,
  })

  if (createError) {
    throw createHttpError(createError.message, 500)
  }

  return createdConversation
}

export const listConversationMessages = async ({ actorId, conversationId, limit }) => {
  await ensureActor(actorId)

  const { data: conversation, error: conversationError } = await findConversationById(conversationId)

  if (conversationError) {
    throw createHttpError(conversationError.message, 500)
  }

  ensureConversationAccess(conversation, actorId)

  const now = new Date().toISOString()
  const [{ data: deliveredRows, error: deliveredError }, { data: readRows, error: readError }] = await Promise.all([
    markConversationMessagesDelivered({
      conversationId,
      recipientEmployeeId: actorId,
      deliveredAt: now,
    }),
    markConversationMessagesRead({
      conversationId,
      recipientEmployeeId: actorId,
      readAt: now,
    }),
  ])

  if (deliveredError) {
    throw createHttpError(deliveredError.message, 500)
  }

  if (readError) {
    throw createHttpError(readError.message, 500)
  }

  const normalizedLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 200) : 100
  const { data: messageRows, error: messagesError } = await listMessagesByConversationId({
    conversationId,
    limit: normalizedLimit,
  })

  if (messagesError) {
    throw createHttpError(messagesError.message, 500)
  }

  const rows = messageRows || []
  const senderIds = [...new Set(rows.map((row) => row.sender_employee_id).filter(Boolean))]
  const senderResults = await Promise.all(senderIds.map((id) => findEmployeeById(id)))
  const senderMap = new Map()

  senderResults.forEach((result) => {
    if (result.error || !result.data) {
      return
    }
    senderMap.set(result.data.id, result.data)
  })

  const profileMap = await buildProfilePictureMap(senderIds)

  const messages = rows
    .map((row) => {
      const sender = senderMap.get(row.sender_employee_id) || null

      return {
        id: row.id,
        conversation_id: row.conversation_id,
        sender_employee_id: row.sender_employee_id,
        content: row.content,
        delivered_at: row.delivered_at,
        read_at: row.read_at,
        status: computeMessageStatus({ message: row, actorId }),
        created_at: row.created_at,
        sender: sender
          ? {
              id: sender.id,
              first_name: sender.first_name,
              last_name: sender.last_name,
              email: sender.email,
              role: sender.role,
              profile_picture_url: profileMap.get(sender.id) || null,
            }
          : null,
      }
    })
    .reverse()

  return {
    messages,
    status_updates: {
      conversation_id: conversationId,
      delivered_message_ids: (deliveredRows || []).map((row) => row.id),
      read_message_ids: (readRows || []).map((row) => row.id),
      reader_employee_id: actorId,
      participant_ids: [conversation.participant_a_employee_id, conversation.participant_b_employee_id],
    },
  }
}

export const sendConversationMessage = async ({ actorId, conversationId, content }) => {
  await ensureActor(actorId)

  const trimmedContent = String(content || '').trim()
  if (!trimmedContent) {
    throw createHttpError('Message content is required.', 400)
  }

  if (trimmedContent.length > 4000) {
    throw createHttpError('Message content is too long (max 4000 chars).', 400)
  }

  const { data: conversation, error: conversationError } = await findConversationById(conversationId)

  if (conversationError) {
    throw createHttpError(conversationError.message, 500)
  }

  ensureConversationAccess(conversation, actorId)

  const { data: message, error: messageError } = await createMessageRecord({
    conversation_id: conversationId,
    sender_employee_id: actorId,
    content: trimmedContent,
    delivered_at: null,
    read_at: null,
  })

  if (messageError) {
    throw createHttpError(messageError.message, 500)
  }

  const { error: updateConversationError } = await updateConversationTimestamp({
    conversationId,
    lastMessageAt: message.created_at,
  })

  if (updateConversationError) {
    throw createHttpError(updateConversationError.message, 500)
  }

  const { data: sender } = await findEmployeeById(actorId)
  const profileMap = await buildProfilePictureMap([actorId])

  return {
    id: message.id,
    conversation_id: message.conversation_id,
    sender_employee_id: message.sender_employee_id,
    content: message.content,
    delivered_at: message.delivered_at,
    read_at: message.read_at,
    status: computeMessageStatus({ message, actorId }),
    created_at: message.created_at,
    sender: sender
      ? {
          id: sender.id,
          first_name: sender.first_name,
          last_name: sender.last_name,
          email: sender.email,
          role: sender.role,
          profile_picture_url: profileMap.get(sender.id) || null,
        }
      : null,
    participant_ids: [conversation.participant_a_employee_id, conversation.participant_b_employee_id],
  }
}

export const markMessageDeliveredRealtime = async ({ actorId, conversationId, messageId }) => {
  await ensureActor(actorId)

  const { data: conversation, error: conversationError } = await findConversationById(conversationId)
  if (conversationError) {
    throw createHttpError(conversationError.message, 500)
  }
  ensureConversationAccess(conversation, actorId)

  const { data: message, error: messageError } = await findMessageById(messageId)
  if (messageError) {
    throw createHttpError(messageError.message, 500)
  }
  if (!message || message.conversation_id !== conversationId) {
    throw createHttpError('Message not found in this conversation.', 404)
  }

  const { data: updated, error: updateError } = await markMessageDeliveredById({
    messageId,
    recipientEmployeeId: actorId,
    deliveredAt: new Date().toISOString(),
  })

  if (updateError) {
    throw createHttpError(updateError.message, 500)
  }

  if (!updated) {
    return null
  }

  return {
    id: updated.id,
    conversation_id: updated.conversation_id,
    sender_employee_id: updated.sender_employee_id,
    status: updated.read_at ? 'read' : 'delivered',
    delivered_at: updated.delivered_at,
    read_at: updated.read_at,
    participant_ids: [conversation.participant_a_employee_id, conversation.participant_b_employee_id],
  }
}

export const markMessageReadRealtime = async ({ actorId, conversationId, messageId }) => {
  await ensureActor(actorId)

  const { data: conversation, error: conversationError } = await findConversationById(conversationId)
  if (conversationError) {
    throw createHttpError(conversationError.message, 500)
  }
  ensureConversationAccess(conversation, actorId)

  const { data: message, error: messageError } = await findMessageById(messageId)
  if (messageError) {
    throw createHttpError(messageError.message, 500)
  }
  if (!message || message.conversation_id !== conversationId) {
    throw createHttpError('Message not found in this conversation.', 404)
  }

  const { data: updated, error: updateError } = await markMessageReadById({
    messageId,
    recipientEmployeeId: actorId,
    readAt: new Date().toISOString(),
  })

  if (updateError) {
    throw createHttpError(updateError.message, 500)
  }

  if (!updated) {
    return null
  }

  return {
    id: updated.id,
    conversation_id: updated.conversation_id,
    sender_employee_id: updated.sender_employee_id,
    status: 'read',
    delivered_at: updated.delivered_at,
    read_at: updated.read_at,
    participant_ids: [conversation.participant_a_employee_id, conversation.participant_b_employee_id],
  }
}