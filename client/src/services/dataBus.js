// Tiny event bus so one data store can tell another "your data is stale".
// e.g. adding a learner changes a class's learner count, so the learners
// store emits "classes" and the classes store refetches. Keeps the stores
// from importing each other in a circle.
const handlers = {}

export const dataBus = {
  on(name, fn) {
    (handlers[name] ??= new Set()).add(fn)
    return () => handlers[name].delete(fn)
  },
  emit(name) {
    handlers[name]?.forEach((fn) => fn())
  },
}
