export enum EventType {
  ASK_FOR_INITIALISATION = "ASK_FOR_INITIALISATION",
  DATA_FOR_INITIALISATION = "DATA_FOR_INITIALISATION",
  DATA_UPDATE = "DATA_UPDATE",
}

function getSuffix(messageType: EventType): string {
  switch (messageType) {
    case EventType.ASK_FOR_INITIALISATION:
      return "ask-for-initialisation";
    case EventType.DATA_FOR_INITIALISATION:
      return "data_initialisation";
    case EventType.DATA_UPDATE:
      return "data_update";
  }
}

export function computeStorageKeyForEvent(key: string, eventType: EventType) {
  const suffix: string = getSuffix(eventType);
  return `${key}-${suffix}`;
}
