type Listener<Value> = (value: Value) => void;
type StorageListener = Listener<StorageEvent>;

export enum MessageType {
  ASK_FOR_INITIALISATION = "ASK_FOR_INITIALISATION",
  DATA_FOR_INITIALISATION = "DATA_FOR_INITIALISATION",
  DATA_UPDATE = "DATA_UPDATE",
}

function getSuffix(messageType: MessageType): string {
  switch (messageType) {
    case MessageType.ASK_FOR_INITIALISATION:
      return "ask-for-initialisation";
    case MessageType.DATA_FOR_INITIALISATION:
      return "data_initialisation";
    case MessageType.DATA_UPDATE:
      return "data_update";
  }
}

function computeStorageKeyForMessage(key: string, messageType: MessageType) {
  const suffix: string = getSuffix(messageType);
  return `${key}-${suffix}`;
}

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
  messageType: MessageType,
  listener: Listener<Value>
): StorageListener {
  const storageKey: string = computeStorageKeyForMessage(key, messageType);
  const wrappedListener = wrapListenerForKey<Value>(storageKey, listener);
  window.addEventListener("storage", wrappedListener);
  return wrappedListener;
}

export function removeListenerOnStorage(storageListener: StorageListener): void {
  window.removeEventListener("storage", storageListener);
}

export function notifyWithLocalStorage<Value>(key: string, messageType: MessageType, value: Value): void {
  const storageKey: string = computeStorageKeyForMessage(key, messageType);
  localStorage.setItem(storageKey, JSON.stringify(value));
  localStorage.removeItem(storageKey);
}
