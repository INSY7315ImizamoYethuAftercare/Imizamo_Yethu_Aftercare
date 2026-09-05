import morgan from 'morgan'
import { isProduction } from '../config/env.js'

// First link in the middleware chain (logger -> authenticate -> authorize
// -> route handler, per the architecture doc). 'dev' is concise and
// colorized for local work; 'combined' is the standard Apache-style
// format that's easier to parse in production log aggregators.
export const requestLogger = morgan(isProduction ? 'combined' : 'dev')
