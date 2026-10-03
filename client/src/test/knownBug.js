// Tests documenting a real, unfixed bug: skipped by default, run with
// RUN_KNOWN_BUGS=1 (see docs/testing/known-bugs.md).
import { it } from 'vitest'

export const itKnownBug = process.env.RUN_KNOWN_BUGS === '1' ? it : it.skip
