import { verifyAuthToken } from '../utils/jwt.js'
import {
  markMessageDeliveredRealtime,
  markMessageReadRealtime,
} from '../services/chat.service.js'

const emitStatusUpdate = (io, statusData) => {
  if (!statusData) {
    return
  }

  const participants = statusData.participant_ids || []
  participants.forEach((participantId) => {
    io.to(`user:${participantId}`).emit('chat:message:status', {
      conversation_id: statusData.conversation_id,
      message_id: statusData.id,
      sender_employee_id: statusData.sender_employee_id,
      status: statusData.status,
      delivered_at: statusData.delivered_at,
      read_at: statusData.read_at,
    })
  })
}

export const registerChatSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) {
        return next(new Error('Authentication token required.'))
      }

      const user = verifyAuthToken(token)
      socket.user = user
      return next()
    } catch {
      return next(new Error('Invalid or expired token.'))
    }
  })

  io.on('connection', (socket) => {
    const actorId = socket.user?.sub

    if (!actorId) {
      socket.disconnect(true)
      return
    }

    socket.join(`user:${actorId}`)

    socket.on('chat:message:delivered', async (payload = {}) => {
      try {
        const statusData = await markMessageDeliveredRealtime({
          actorId,
          conversationId: payload.conversation_id,
          messageId: payload.message_id,
        })

        emitStatusUpdate(io, statusData)
      } catch {
        // Ignore malformed acknowledgements.
      }
    })

    socket.on('chat:message:read', async (payload = {}) => {
      try {
        const statusData = await markMessageReadRealtime({
          actorId,
          conversationId: payload.conversation_id,
          messageId: payload.message_id,
        })

        emitStatusUpdate(io, statusData)
      } catch {
        // Ignore malformed acknowledgements.
      }
    })
  })
}