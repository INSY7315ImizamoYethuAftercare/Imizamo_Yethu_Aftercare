import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const SALT_ROUNDS = 10

export class AuthService {

  constructor(userRepository) {
    this.userRepository = userRepository
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async register({ email, password, role, fullName }) {

    if (role === 'admin' || role === 'manager' || role === 'teacher') {
      const err = new Error('This role cannot self-register')
      err.status = 403
      throw err
    }

    const existing = await this.userRepository.findByEmail(email)

    if (existing) {
      const err = new Error('An account with this email already exists')
      err.status = 409
      throw err
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    return this.userRepository.createUser({ email, role, passwordHash, fullName, isActive: true })
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async login({ email, password }) {

    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      const err = new Error('No account at all')
      err.status = 401
      throw err
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatches) {
      const err = new Error('Invalid email or password')
      err.status = 401
      throw err
    }

    if(!user.is_active) {
      const err = new Error('User not active')
      err.status = 403
      throw err
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      env.jwtSecret,
      { expiresIn: '8h' },
    )
    
    return {
      token,
      user: { userId: user.user_id, email: user.email, role: user.role, fullName: user.full_name },
    }
  }
}