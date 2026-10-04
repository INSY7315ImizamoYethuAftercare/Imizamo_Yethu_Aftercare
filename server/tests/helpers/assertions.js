/**
 * Walks any JSON value and returns the dotted path of the first key matching
 * `pattern`, or null if none does. Used to prove password_hash (or any
 * password-ish field) never leaves the API.
 */
export function findKeyDeep(value, pattern, path = '$') {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const hit = findKeyDeep(value[i], pattern, `${path}[${i}]`)
      if (hit) return hit
    }
    return null
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (pattern.test(key)) return `${path}.${key}`
      const hit = findKeyDeep(child, pattern, `${path}.${key}`)
      if (hit) return hit
    }
  }
  return null
}

/** True when a response body looks like it leaked a stack trace or SQL. */
export function leaksInternals(body) {
  const text = JSON.stringify(body ?? '')
  return (
    /"stack"\s*:/.test(text) ||
    /\bat .+\.js:\d+/.test(text) ||
    /\b(SELECT|INSERT|UPDATE|DELETE)\b.+\b(FROM|INTO|SET)\b/i.test(text) ||
    /syntax error at or near|violates (unique|foreign key|check) constraint|invalid input syntax/i.test(text) ||
    /node_modules|[A-Z]:\\\\|\/src\//.test(text)
  )
}
