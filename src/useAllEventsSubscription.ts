import { DependencyList, MutableRefObject, useLayoutEffect, useRef } from "react";
import { addListenerOnStorage, Listener, notify, removeListenerOnStorage } from "./messages";
import { SetState } from "./useTabsState";
import { allEventsTypes, EventType } from "./eventsTypes";

interface ActionOnEventParams<State> {
  key: string;
  state: State;
  setState: SetState<State>;
  isAlreadyInitialisedRef: MutableRefObject<boolean>;
}

function notifyOwnDataForInitialisation<State>({
  key,
  state,
  isAlreadyInitialisedRef,
}: ActionOnEventParams<State>): [Listener<State>, DependencyList] {
  const listener = () => {
    isAlreadyInitialisedRef.current = true;
    notify(key, EventType.DATA_FOR_INITIALISATION, state);
  };

  const dependencies = [state];
  return [listener, dependencies];
}

function initialiseOwnStateIfNotAlreadyInitialised<State>({
  setState,
  isAlreadyInitialisedRef,
}: ActionOnEventParams<State>): [Listener<State>, DependencyList] {
  const listener = (eventData: State) => {
    if (!isAlreadyInitialisedRef.current) {
      setState(eventData);
      isAlreadyInitialisedRef.current = true;
    }
  };

  const dependencies = [setState, isAlreadyInitialisedRef.current];
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

export function useAllEventsSubscription<State>(key: string, state: State, setState: SetState<State>) {
  const isAlreadyInitialisedRef: MutableRefObject<boolean> = useRef(false);

  const actionOnEventParams: ActionOnEventParams<State> = { key, state, setState, isAlreadyInitialisedRef };

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
