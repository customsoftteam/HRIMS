import { supabase } from '../../config/supabase.js'

export const findEmployeeById = async (employeeId) => {
  return supabase
    .from('employees')
    .select('id, first_name, last_name, email, role, company_id')
    .eq('id', employeeId)
    .maybeSingle()
}

export const listCompanyEmployees = async ({ companyId, excludeEmployeeId }) => {
  let query = supabase
    .from('employees')
    .select('id, first_name, last_name, email, role, company_id, created_at')
    .eq('company_id', companyId)
    .order('first_name', { ascending: true })

  if (excludeEmployeeId) {
    query = query.neq('id', excludeEmployeeId)
  }

  return query
}

export const listConversationsForEmployee = async ({ employeeId }) => {
  return supabase
    .from('chat_conversations')
    .select('id, company_id, participant_a_employee_id, participant_b_employee_id, created_by_employee_id, last_message_at, created_at, updated_at')
    .or(`participant_a_employee_id.eq.${employeeId},participant_b_employee_id.eq.${employeeId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
}

export const findConversationById = async (conversationId) => {
  return supabase
    .from('chat_conversations')
    .select('id, company_id, participant_a_employee_id, participant_b_employee_id, created_by_employee_id, last_message_at, created_at, updated_at')
    .eq('id', conversationId)
    .maybeSingle()
}

export const findConversationByParticipantPair = async ({ participantAEmployeeId, participantBEmployeeId }) => {
  return supabase
    .from('chat_conversations')
    .select('id, company_id, participant_a_employee_id, participant_b_employee_id, created_by_employee_id, last_message_at, created_at, updated_at')
    .eq('participant_a_employee_id', participantAEmployeeId)
    .eq('participant_b_employee_id', participantBEmployeeId)
    .maybeSingle()
}

export const createConversationRecord = async (payload) => {
  return supabase
    .from('chat_conversations')
    .insert(payload)
    .select('id, company_id, participant_a_employee_id, participant_b_employee_id, created_by_employee_id, last_message_at, created_at, updated_at')
    .single()
}

export const listMessagesByConversationId = async ({ conversationId, limit = 100 }) => {
  return supabase
    .from('chat_messages')
    .select('id, conversation_id, sender_employee_id, content, delivered_at, read_at, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)
}

export const createMessageRecord = async (payload) => {
  return supabase
    .from('chat_messages')
    .insert(payload)
    .select('id, conversation_id, sender_employee_id, content, delivered_at, read_at, created_at')
    .single()
}

export const findMessageById = async (messageId) => {
  return supabase
    .from('chat_messages')
    .select('id, conversation_id, sender_employee_id, content, delivered_at, read_at, created_at')
    .eq('id', messageId)
    .maybeSingle()
}

export const markMessageDeliveredById = async ({ messageId, recipientEmployeeId, deliveredAt }) => {
  return supabase
    .from('chat_messages')
    .update({ delivered_at: deliveredAt })
    .eq('id', messageId)
    .neq('sender_employee_id', recipientEmployeeId)
    .is('delivered_at', null)
    .select('id, conversation_id, sender_employee_id, delivered_at, read_at')
    .maybeSingle()
}

export const markMessageReadById = async ({ messageId, recipientEmployeeId, readAt }) => {
  return supabase
    .from('chat_messages')
    .update({
      read_at: readAt,
      delivered_at: readAt,
    })
    .eq('id', messageId)
    .neq('sender_employee_id', recipientEmployeeId)
    .is('read_at', null)
    .select('id, conversation_id, sender_employee_id, delivered_at, read_at')
    .maybeSingle()
}

export const markConversationMessagesDelivered = async ({ conversationId, recipientEmployeeId, deliveredAt }) => {
  return supabase
    .from('chat_messages')
    .update({ delivered_at: deliveredAt })
    .eq('conversation_id', conversationId)
    .neq('sender_employee_id', recipientEmployeeId)
    .is('delivered_at', null)
    .select('id')
}

export const markConversationMessagesRead = async ({ conversationId, recipientEmployeeId, readAt }) => {
  return supabase
    .from('chat_messages')
    .update({
      read_at: readAt,
      delivered_at: readAt,
    })
    .eq('conversation_id', conversationId)
    .neq('sender_employee_id', recipientEmployeeId)
    .is('read_at', null)
    .select('id')
}

export const markConversationSetDelivered = async ({ conversationIds, recipientEmployeeId, deliveredAt }) => {
  if (!conversationIds.length) {
    return { data: [], error: null }
  }

  return supabase
    .from('chat_messages')
    .update({ delivered_at: deliveredAt })
    .in('conversation_id', conversationIds)
    .neq('sender_employee_id', recipientEmployeeId)
    .is('delivered_at', null)
    .select('id')
}

export const listUnreadConversationMessages = async ({ conversationIds, recipientEmployeeId }) => {
  if (!conversationIds.length) {
    return { data: [], error: null }
  }

  return supabase
    .from('chat_messages')
    .select('id, conversation_id')
    .in('conversation_id', conversationIds)
    .neq('sender_employee_id', recipientEmployeeId)
    .is('read_at', null)
}

export const updateConversationTimestamp = async ({ conversationId, lastMessageAt }) => {
  return supabase
    .from('chat_conversations')
    .update({
      last_message_at: lastMessageAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .select('id, last_message_at, updated_at')
    .single()
}

export const listProfileDetailsByEmployeeIds = async (employeeIds = []) => {
  if (!employeeIds.length) {
    return { data: [], error: null }
  }

  return supabase
    .from('employee_profiles')
    .select('employee_id, personal_details')
    .in('employee_id', employeeIds)
}