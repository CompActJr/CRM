import { Router } from 'express'
import * as authController from '../controllers/auth.controller.js'

const authRoutes = Router()

authRoutes.post('/login', authController.login)
authRoutes.get('/me', authController.me)

export default authRoutes
