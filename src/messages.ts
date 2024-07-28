import { computeStorageKeyForEvent, EventType } from "./eventsTypes";

export type Listener<Value> = (value: Value) => void;
type StorageListener = Listener<StorageEvent>;

function wrapListenerForKey<Value>(storageKey: string, listener: Listener<Value>): StorageListener {
  return ({ key, newValue }: StorageEvent) => {
    const eventIsOnThisState: boolean = key === storageKey && newValue !== null;
    if (eventIsOnThisState) {
      const newValueParsed: Value = JSON.parse(newValue!);
      listener(newValueParsed);
    }
  };
}

export function addListenerOnStorage<Value>(
  key: string,
  messageType: EventType,
  listener: Listener<Value>
): StorageListener {
  const storageKey: string = computeStorageKeyForEvent(key, messageType);
  const wrappedListener = wrapListenerForKey<Value>(storageKey, listener);
  window.addEventListener("storage", wrappedListener);
  return wrappedListener;
}

export function removeListenerOnStorage(storageListener: StorageListener): void {
  window.removeEventListener("storage", storageListener);
}

export function notify<Value>(key: string, messageType: EventType, value: Value): void {
  const storageKey: string = computeStorageKeyForEvent(key, messageType);
  localStorage.setItem(storageKey, JSON.stringify(value));
  localStorage.removeItem(storageKey);
}
