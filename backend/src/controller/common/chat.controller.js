import {
  createOrGetConversation,
  listChatContacts,
  listConversationMessages,
  listMyConversations,
  sendConversationMessage,
} from '../../services/chat.service.js'
import { getIOInstance } from '../../socket/io.instance.js'

export const getChatContacts = async (req, res) => {
  try {
    const data = await listChatContacts({ actorId: req.user.sub })
    return res.json({
      success: true,
      message: 'Chat contacts fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch chat contacts.',
    })
  }
}

export const getMyConversations = async (req, res) => {
  try {
    const data = await listMyConversations({ actorId: req.user.sub })
    return res.json({
      success: true,
      message: 'Conversations fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch conversations.',
    })
  }
}

export const createConversation = async (req, res) => {
  try {
    const data = await createOrGetConversation({
      actorId: req.user.sub,
      participantEmployeeId: req.body?.participant_employee_id,
    })

    return res.status(201).json({
      success: true,
      message: 'Conversation created successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create conversation.',
    })
  }
}

export const getConversationMessages = async (req, res) => {
  try {
    const result = await listConversationMessages({
      actorId: req.user.sub,
      conversationId: req.params.conversationId,
      limit: req.query.limit,
    })

    const io = getIOInstance()
    if (io && result?.status_updates?.participant_ids?.length) {
      const payload = {
        conversation_id: result.status_updates.conversation_id,
        message_ids: result.status_updates.read_message_ids,
        reader_employee_id: result.status_updates.reader_employee_id,
        status: 'read',
      }

      result.status_updates.participant_ids.forEach((participantId) => {
        io.to(`user:${participantId}`).emit('chat:messages:bulk-status', payload)
      })
    }

    return res.json({
      success: true,
      message: 'Messages fetched successfully.',
      data: result.messages,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch messages.',
    })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const data = await sendConversationMessage({
      actorId: req.user.sub,
      conversationId: req.params.conversationId,
      content: req.body?.content,
    })

    const io = getIOInstance()
    if (io && data?.participant_ids?.length) {
      data.participant_ids.forEach((participantId) => {
        io.to(`user:${participantId}`).emit('chat:message:new', data)
      })
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to send message.',
    })
  }
}