import { getUpdates, publishUpdate } from '../../services/updates.service.js'

export const publishUpdateController = async (req, res) => {
  try {
    const data = await publishUpdate({ actorId: req.user.sub, payload: req.body })
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to publish update.' })
  }
}

export const getUpdatesController = async (req, res) => {
  try {
    const data = await getUpdates({
      actorId: req.user.sub,
      category: req.query.category,
      limit: req.query.limit,
    })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch updates.' })
  }
}
