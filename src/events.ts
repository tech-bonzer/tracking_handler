import type {
  BonzerDataLayer,
  BonzerEvent,
  BonzerEventInput,
  BonzerEventName,
} from './types'

type Listener = (event: BonzerEvent) => void

const createId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

export function initEvents(): BonzerDataLayer {
  if (window.bonzer?.hooks && Array.isArray(window.bonzer.buffer)) {
    return window.bonzer
  }

  const buffer = Array.isArray(window.bonzer?.buffer) ? window.bonzer.buffer : []
  const listeners = new Set<Listener>()

  const hooks = {
    emit(input: BonzerEventInput): void {
      const event = {
        ...input,
        timestamp: new Date(),
        _id: createId(),
      } as BonzerEvent

      buffer.push(event)
      for (const listener of [...listeners]) listener(event)
    },

    filter<N extends BonzerEventName>(
      names: readonly N[],
      source: readonly BonzerEvent[] = buffer,
    ): Array<BonzerEvent<N>> {
      const selected = new Set<BonzerEventName>(names)
      return source.filter((event): event is BonzerEvent<N> =>
        selected.has(event.name),
      )
    },

    subscribe(
      callback: Listener,
      eventNames?: readonly BonzerEventName[],
    ): () => void {
      const selected = eventNames ? new Set(eventNames) : undefined
      const deliver = (event: BonzerEvent): void => {
        if (!selected || selected.has(event.name)) callback(event)
      }

      // Replay a snapshot. New events emitted by a replay callback are handled
      // only by the live listener, avoiding duplicate delivery and global IDs.
      const previousEvents = [...buffer]
      listeners.add(deliver)
      for (const event of previousEvents) deliver(event)

      return () => listeners.delete(deliver)
    },
  }

  window.bonzer = { buffer, hooks }
  hooks.emit({ name: 'events.initialized', payload: undefined })
  return window.bonzer
}
