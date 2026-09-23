import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function authenticate(req, res, next) {
    const token = req.cookies?.token
    if (!token) {
        const err = new Error('Not aunthenticated')
        err.status = 401
        return next(err)
    }
    try {
        req.user = jwt.verify(token, env.jwtSecret) // { userId, role }
        next()
    } catch {
        const err = new Error('Invalid or expired session')
        err.status = 401
        next(err)
    }
}

export function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
        const err = new Error('Not aunthenticated')
        err.status = 401
        return next(err)
    }
    if (!allowedRoles.includes(req.user.role)) {
        const err = new Error('You do not have permission to perform this action')
        err.status = 403
        return next(err)
    }
    next()
    }
}