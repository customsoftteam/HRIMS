import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, CheckCheck } from 'lucide-react'
import { io } from 'socket.io-client'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken, getAuthUser } from '../../utils/auth.js'

const formatTime = (value) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const buildDisplayName = (user) => {
  if (!user) {
    return 'Unknown User'
  }

  return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User'
}

function Avatar({ user, size = 'size-10' }) {
  const displayName = buildDisplayName(user)
  const initial = displayName.slice(0, 1).toUpperCase() || 'U'

  if (user?.profile_picture_url) {
    return <img src={user.profile_picture_url} alt={displayName} className={`${size} rounded-full border border-black/10 object-cover`} />
  }

  return (
    <div className={`${size} flex items-center justify-center rounded-full border border-black/10 bg-[#f5f6fa] text-xs font-semibold text-black/60`}>
      {initial}
    </div>
  )
}

function MessageStatusTick({ status }) {
  if (!status || status === 'sent') {
    return <Check className="size-3" />
  }

  if (status === 'delivered') {
    return <CheckCheck className="size-3" />
  }

  return <CheckCheck className="size-3 text-sky-500" />
}

function InternalChatPage() {
  const authUser = getAuthUser()
  const role = authUser?.role || 'employee'

  const [contacts, setContacts] = useState([])
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const socketRef = useRef(null)
  const selectedConversationIdRef = useRef(null)

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    }),
    []
  )

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  )

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId
  }, [selectedConversationId])

  const fetchContacts = async () => {
    const response = await fetch(`${API_BASE_URL}/api/chat/contacts`, {
      headers: authHeaders,
    })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch chat contacts.')
    }
    setContacts(payload.data || [])
  }

  const fetchConversations = async () => {
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
      headers: authHeaders,
    })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch conversations.')
    }

    const rows = payload.data || []
    setConversations(rows)
    if (!selectedConversationId && rows.length) {
      setSelectedConversationId(rows[0].id)
    }
  }

  const fetchMessages = async (conversationId) => {
    if (!conversationId) {
      setMessages([])
      return
    }

    setLoadingMessages(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages?limit=200`, {
        headers: authHeaders,
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to fetch messages.')
      }
      setMessages(payload.data || [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setErrorMessage('')
        await Promise.all([fetchContacts(), fetchConversations()])
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([])
      return
    }

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversationId
          ? {
              ...conversation,
              unread_count: 0,
            }
          : conversation
      )
    )

    fetchMessages(selectedConversationId)
  }, [selectedConversationId])

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      return
    }

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('chat:message:new', (incomingMessage) => {
      if (!incomingMessage?.id || !incomingMessage?.conversation_id) {
        return
      }

      const activeConversationId = selectedConversationIdRef.current
      const isMine = incomingMessage.sender_employee_id === authUser?.id

      setConversations((current) => {
        const existingIndex = current.findIndex((row) => row.id === incomingMessage.conversation_id)
        if (existingIndex === -1) {
          return current
        }

        const existing = current[existingIndex]
        const updated = {
          ...existing,
          last_message_at: incomingMessage.created_at,
          latest_message: {
            id: incomingMessage.id,
            content: incomingMessage.content,
            sender_employee_id: incomingMessage.sender_employee_id,
            status: incomingMessage.status || null,
            created_at: incomingMessage.created_at,
          },
          unread_count:
            !isMine && activeConversationId !== incomingMessage.conversation_id
              ? (existing.unread_count || 0) + 1
              : existing.unread_count || 0,
        }

        const next = [updated, ...current.filter((row) => row.id !== incomingMessage.conversation_id)]
        return next
      })

      if (incomingMessage.conversation_id === activeConversationId) {
        setMessages((current) => {
          if (current.some((row) => row.id === incomingMessage.id)) {
            return current
          }
          return [...current, incomingMessage]
        })
      }

      if (!isMine) {
        socket.emit('chat:message:delivered', {
          conversation_id: incomingMessage.conversation_id,
          message_id: incomingMessage.id,
        })

        if (incomingMessage.conversation_id === activeConversationId) {
          socket.emit('chat:message:read', {
            conversation_id: incomingMessage.conversation_id,
            message_id: incomingMessage.id,
          })
        }
      }
    })

    socket.on('chat:message:status', (statusUpdate) => {
      if (!statusUpdate?.message_id) {
        return
      }

      setMessages((current) =>
        current.map((row) =>
          row.id === statusUpdate.message_id
            ? {
                ...row,
                status: statusUpdate.status,
                delivered_at: statusUpdate.delivered_at || row.delivered_at,
                read_at: statusUpdate.read_at || row.read_at,
              }
            : row
        )
      )

      setConversations((current) =>
        current.map((row) => {
          if (row.id !== statusUpdate.conversation_id || !row.latest_message) {
            return row
          }

          if (row.latest_message.id !== statusUpdate.message_id) {
            return row
          }

          return {
            ...row,
            latest_message: {
              ...row.latest_message,
              status: statusUpdate.status,
            },
          }
        })
      )
    })

    socket.on('chat:messages:bulk-status', (payload) => {
      if (!payload?.conversation_id || !Array.isArray(payload.message_ids)) {
        return
      }

      const idSet = new Set(payload.message_ids)

      if (payload.status === 'read' && payload.reader_employee_id === authUser?.id) {
        setConversations((current) =>
          current.map((row) =>
            row.id === payload.conversation_id
              ? {
                  ...row,
                  unread_count: 0,
                }
              : row
          )
        )
      }

      setMessages((current) =>
        current.map((row) =>
          idSet.has(row.id)
            ? {
                ...row,
                status: payload.status,
                read_at: payload.status === 'read' ? new Date().toISOString() : row.read_at,
              }
            : row
        )
      )
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const handleStartConversation = async (contactId) => {
    try {
      setErrorMessage('')
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ participant_employee_id: contactId }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to open conversation.')
      }

      const conversation = payload.data
      await fetchConversations()
      setSelectedConversationId(conversation.id)
      await fetchMessages(conversation.id)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()
    if (!selectedConversationId) {
      setErrorMessage('Select or start a conversation first.')
      return
    }

    const trimmed = messageText.trim()
    if (!trimmed) {
      return
    }

    try {
      setErrorMessage('')
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: trimmed }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to send message.')
      }

      setMessageText('')
      setMessages((current) => (current.some((row) => row.id === payload.data.id) ? current : [...current, payload.data]))
      await fetchConversations()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <DashboardLayout role={role} title="Internal Chat" subtitle="Connect and chat with your team members instantly.">
      <div className="space-y-4">
        {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{errorMessage}</p> : null}

        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <section className="rounded-2xl border border-black/10 bg-white p-4">
            <h3 className="text-base font-semibold text-black">Conversations</h3>
            <div className="mt-3 space-y-2">
              {loading ? (
                <p className="text-sm text-black/60">Loading conversations...</p>
              ) : conversations.length ? (
                conversations.map((conversation) => {
                  const isActive = conversation.id === selectedConversationId
                  const counterpart = conversation.counterpart
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${isActive ? 'border-black/25 bg-black/5' : 'border-black/10 hover:bg-[#f8f8fa]'}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar user={counterpart} size="size-9" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-black">{buildDisplayName(counterpart)}</p>
                          <p className="truncate text-xs text-black/60">{conversation.latest_message?.content || 'No messages yet'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-[11px] text-black/45">{formatTime(conversation.last_message_at || conversation.latest_message?.created_at)}</p>
                          {conversation.unread_count ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  )
                })
              ) : (
                <p className="text-sm text-black/60">No conversations yet. Start with a contact below.</p>
              )}
            </div>

            <h4 className="mt-6 text-sm font-semibold text-black">Start New Chat</h4>
            <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
              {contacts.length ? (
                contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleStartConversation(contact.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-black/10 px-3 py-2 text-left transition hover:bg-[#f8f8fa]"
                  >
                    <Avatar user={contact} size="size-8" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-black">{buildDisplayName(contact)}</p>
                      <p className="truncate text-xs text-black/55">{contact.role}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-black/60">No contacts available.</p>
              )}
            </div>
          </section>

          <section className="flex min-h-[34rem] flex-col rounded-2xl border border-black/10 bg-white">
            <div className="border-b border-black/10 px-4 py-3">
              {selectedConversation?.counterpart ? (
                <div className="flex items-center gap-3">
                  <Avatar user={selectedConversation.counterpart} size="size-10" />
                  <div>
                    <p className="text-sm font-semibold text-black">{buildDisplayName(selectedConversation.counterpart)}</p>
                    <p className="text-xs text-black/55">{selectedConversation.counterpart.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-black/60">Select a conversation to start chatting.</p>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {loadingMessages ? (
                <p className="text-sm text-black/60">Loading messages...</p>
              ) : selectedConversationId ? (
                messages.length ? (
                  messages.map((message) => {
                    const isMine = message.sender_employee_id === authUser?.id
                    return (
                      <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'bg-black text-white' : 'border border-black/10 bg-[#f8f8fa] text-black'}`}>
                          {!isMine && message.sender ? <p className="mb-1 text-[11px] font-semibold text-black/55">{buildDisplayName(message.sender)}</p> : null}
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <div className={`mt-1 flex items-center gap-1 text-[10px] ${isMine ? 'justify-end text-white/70' : 'text-black/45'}`}>
                            <span>{formatTime(message.created_at)}</span>
                            {isMine ? <MessageStatusTick status={message.status} /> : null}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-black/60">No messages yet. Send the first message.</p>
                )
              ) : (
                <p className="text-sm text-black/60">Pick a conversation from the left panel.</p>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-black/10 p-3">
              <div className="flex gap-2">
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder={selectedConversationId ? 'Type your message...' : 'Start or select a conversation first'}
                  disabled={!selectedConversationId}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/25 focus:ring-2 focus:ring-black/5 disabled:cursor-not-allowed disabled:bg-[#f7f7f7]"
                />
                <button
                  type="submit"
                  disabled={!selectedConversationId || !messageText.trim()}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Send
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default InternalChatPage