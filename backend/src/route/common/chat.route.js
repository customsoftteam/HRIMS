import { Router } from 'express'
import {
  createConversation,
  getChatContacts,
  getConversationMessages,
  getMyConversations,
  sendMessage,
} from '../../controller/common/chat.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/contacts', requireAuth, getChatContacts)
router.get('/conversations', requireAuth, getMyConversations)
router.post('/conversations', requireAuth, createConversation)
router.get('/conversations/:conversationId/messages', requireAuth, getConversationMessages)
router.post('/conversations/:conversationId/messages', requireAuth, sendMessage)

export default router