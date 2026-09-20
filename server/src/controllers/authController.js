import { AuthService } from '../services/AuthService.js'
import UserRepository from '../repositories/UserRepository.js'
import { pool } from '../db/pool.js'
import { isProduction } from '../config/env.js'

const authService = new AuthService(new UserRepository(pool))

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000,
}

export async function register(req, res, next) {
  try {
    const { email, password, role, fullName } = req.body
    if (!email || !password || !role || !fullName) {
      const err = new Error('email, password, role and fullName are all required')
      err.status = 400
      throw err
    }
    const user = await authService.register({ email, password, role, fullName })
    res.status(201).json({ userId: user.user_id, email: user.email, role: user.role })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      const err = new Error('email and password are required')
      err.status = 400
      throw err
    }
    const { token, user } = await authService.login({ email, password })
    res.cookie('token', token, cookieOptions)
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

export function logout(req, res) {
  res.clearCookie('token', cookieOptions)
  res.json({ message: 'Logged out successfully' })
}

export function me(req, res) {
  res.json({ user: req.user })
}