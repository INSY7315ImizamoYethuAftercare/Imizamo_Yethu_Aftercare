import { pool as defaultPool } from './pool.js'

/**
 * Runs `work` inside a single database transaction. `work` receives a
 * dedicated client; repositories accept it in place of the pool (they only
 * call `.query`), so several writes either all commit or all roll back.
 *
 * @param {(client: import('pg').PoolClient) => Promise<T>} work
 * @param {import('pg').Pool} [pool]
 * @returns {Promise<T>}
 * @template T
 */
export async function withTransaction(work, pool = defaultPool) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}
