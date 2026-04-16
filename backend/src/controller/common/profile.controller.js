import {
  createMyProfileDetails,
  deleteMyProfileDetails,
  getMyProfileDetails,
  uploadMyProfileAvatar,
  updateMyProfileDetails,
} from '../../services/profile.service.js'

export const getMyProfile = async (req, res) => {
  try {
    const data = await getMyProfileDetails({ actorId: req.user.sub })

    return res.json({
      success: true,
      message: 'Profile fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch profile.',
    })
  }
}

export const createMyProfile = async (req, res) => {
  try {
    const data = await createMyProfileDetails({
      actorId: req.user.sub,
      payload: req.body || {},
    })

    return res.status(201).json({
      success: true,
      message: 'Profile created successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create profile.',
    })
  }
}

export const updateMyProfile = async (req, res) => {
  try {
    const data = await updateMyProfileDetails({
      actorId: req.user.sub,
      payload: req.body || {},
    })

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update profile.',
    })
  }
}

export const deleteMyProfile = async (req, res) => {
  try {
    const data = await deleteMyProfileDetails({ actorId: req.user.sub })

    return res.json({
      success: true,
      message: 'Profile deleted successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete profile.',
    })
  }
}

export const uploadProfileAvatar = async (req, res) => {
  try {
    const data = await uploadMyProfileAvatar({
      actorId: req.user.sub,
      file: req.file,
    })

    return res.json({
      success: true,
      message: 'Profile picture uploaded successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload profile picture.',
    })
  }
}
