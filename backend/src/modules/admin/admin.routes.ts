import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { authenticate, requireAdmin } from '../../middleware/auth.js'
import { getAdminStats } from './admin.service.js'

const router = Router()

router.get('/stats', authenticate, requireAdmin, asyncHandler(async (_request, response) => {
  response.json(await getAdminStats())
}))

export default router
