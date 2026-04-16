import 'dotenv/config'
import express from 'express'
import { createServer } from 'node:http'
import cors from 'cors'
import { Server as SocketIOServer } from 'socket.io'
import { supabase } from './config/supabase.js'
import authRoute from './route/common/auth.route.js'
import profileRoute from './route/common/profile.route.js'
import catalogRoute from './route/common/catalog.route.js'
import chatRoute from './route/common/chat.route.js'
import leaveRoute from './route/common/leave.route.js'
import updatesRoute from './route/common/updates.route.js'
import adminRoute from './route/admin/admin.route.js'
import adminUserRoute from './route/admin/user.route.js'
import adminOrgRoute from './route/admin/org.route.js'
import hrUserRoute from './route/hr/user.route.js'
import hrRoute from './route/hr/hr.route.js'
import managerRoute from './route/manager/manager.route.js'
import employeeRoute from './route/employee/employee.route.js'
import platformSetupRoute from './route/platform/setup.route.js'
import { registerChatSocket } from './socket/chat.socket.js'
import { setIOInstance } from './socket/io.instance.js'

const app = express()
const httpServer = createServer(app)
const port = process.env.PORT || 4000
const socketCorsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: socketCorsOrigin,
    methods: ['GET', 'POST'],
  },
})

registerChatSocket(io)
setIOInstance(io)

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  })
)
app.use(express.json())

app.use('/api/auth', authRoute)
app.use('/api/profile', profileRoute)
app.use('/api/catalog', catalogRoute)
app.use('/api/chat', chatRoute)
app.use('/api/leave', leaveRoute)
app.use('/api/updates', updatesRoute)
app.use('/api/platform/setup', platformSetupRoute)
app.use('/api/admin', adminRoute)
app.use('/api/admin', adminUserRoute)
app.use('/api/admin', adminOrgRoute)
app.use('/api/hr', hrRoute)
app.use('/api/hr', hrUserRoute)
app.use('/api/manager', managerRoute)
app.use('/api/employee', employeeRoute)

async function checkSupabaseConnection() {
  const configured = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  if (!configured) {
    return {
      configured: false,
      connected: false,
      error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing',
    }
  }

  try {
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    })

    if (error) {
      return {
        configured: true,
        connected: false,
        error: error.message,
      }
    }

    return {
      configured: true,
      connected: true,
      error: null,
    }
  } catch (error) {
    return {
      configured: true,
      connected: false,
      error: error.message,
    }
  }
}

app.get('/api/health', async (_req, res) => {
  const supabaseStatus = await checkSupabaseConnection()

  res.json({
    ok: supabaseStatus.connected,
    service: 'hrims-backend',
    supabaseConfigured: supabaseStatus.configured,
    supabaseConnected: supabaseStatus.connected,
    supabaseError: supabaseStatus.error,
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/supabase-status', async (_req, res) => {
  const status = await checkSupabaseConnection()

  if (!status.connected) {
    return res.status(503).json({
      ok: false,
      supabaseConfigured: status.configured,
      supabaseConnected: false,
      error: status.error,
    })
  }

  return res.json({
    ok: true,
    supabaseConfigured: true,
    supabaseConnected: true,
    message: 'Supabase connection successful',
  })
})

httpServer.listen(port, async () => {
  console.log(`Backend running on http://localhost:${port}`)

  const status = await checkSupabaseConnection()
  if (status.connected) {
    console.log('Database connected successfully')
  } else {
    console.log(`Database connection failed: ${status.error}`)
  }
})
