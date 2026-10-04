// Tests that document a real, unfixed bug. They are skipped by default so CI
// stays green, and every one carries a TODO with the bug id and issue number
// (full list: docs/testing/known-bugs.md). Run them with RUN_KNOWN_BUGS=1 to
// see them fail; once a bug is fixed, change itKnownBug back to it.
import { it } from '@jest/globals'

export const itKnownBug = process.env.RUN_KNOWN_BUGS === '1' ? it : it.skip
