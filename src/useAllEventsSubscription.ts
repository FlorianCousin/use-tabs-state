import { DependencyList, useLayoutEffect } from "react";
import { addListenerOnStorage, Listener, notify, removeListenerOnStorage } from "./messages";
import { SetState } from "./useTabsState";
import { EventType } from "./eventsTypes";

let stateAlreadyInitialised: boolean = false;

export interface ActionOnEventParams<State> {
  key: string;
  state: State;
  setState: SetState<State>;
}

function notifyOwnDataForInitialisation<State>({
  key,
  state,
}: ActionOnEventParams<State>): [Listener<State>, DependencyList] {
  const listener = () => {
    stateAlreadyInitialised = true;
    notify(key, EventType.DATA_FOR_INITIALISATION, state);
  };

  const dependencies = [state];
  return [listener, dependencies];
}

function initialiseOwnStateIfNotAlreadyInitialised<State>({
  setState,
}: ActionOnEventParams<State>): [Listener<State>, DependencyList] {
  const listener = (eventDate: State) => {
    if (!stateAlreadyInitialised) {
      setState(eventDate);
      stateAlreadyInitialised = true;
    }
  };

  const dependencies = [setState];
  return [listener, dependencies];
}

function getActionOnEvent<State>(
  eventTypeRecieved: EventType
): (actionOnEventParams: ActionOnEventParams<State>) => [Listener<State>, DependencyList] {
  switch (eventTypeRecieved) {
    case EventType.ASK_FOR_INITIALISATION:
      return notifyOwnDataForInitialisation;
    case EventType.DATA_FOR_INITIALISATION:
      return initialiseOwnStateIfNotAlreadyInitialised;
    case EventType.DATA_UPDATE:
      return ({ setState }) => [setState, [setState]];
  }
}

const allEventsTypes: EventType[] = [
  EventType.DATA_UPDATE,
  EventType.DATA_FOR_INITIALISATION,
  EventType.ASK_FOR_INITIALISATION,
];

export function useAllEventsSubscription<State>(actionOnEventParams: ActionOnEventParams<State>) {
  allEventsTypes.forEach(messageType => registerActionForMessage(actionOnEventParams, messageType));
}

function registerActionForMessage<State>(
  actionOnEventParams: ActionOnEventParams<State>,
  messageType: EventType
): void {
  const [listener, dependencies] = getActionOnEvent<State>(messageType)(actionOnEventParams);
  useLayoutEffect(() => {
    const registeredListener = addListenerOnStorage(actionOnEventParams.key, messageType, listener);
    return () => removeListenerOnStorage(registeredListener);
  }, dependencies);
}
