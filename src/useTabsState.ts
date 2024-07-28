import { DependencyList, Dispatch, SetStateAction, useLayoutEffect, useState } from "react";
import {
  addListenerOnStorage,
  Listener,
  MessageType,
  notifyWithLocalStorage,
  removeListenerOnStorage,
} from "./messages";

export type InitialState<State> = State | (() => State);
export type SetState<State> = Dispatch<SetStateAction<State>>;
export type UseStateReturn<State> = [State, SetState<State>];

interface ActionOnEventParams<State> {
  key: string;
  state: State;
  setState: SetState<State>;
}

let stateAlreadyInitialised: boolean = false;

function notifyOwnDataForInitialisation<State>({
  key,
  state,
}: ActionOnEventParams<State>): [Listener<State>, DependencyList] {
  const listener = () => {
    stateAlreadyInitialised = true;
    notifyWithLocalStorage(key, MessageType.DATA_FOR_INITIALISATION, state);
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
  messageTypeRecieved: MessageType
): (actionOnEventParams: ActionOnEventParams<State>) => [Listener<State>, DependencyList] {
  switch (messageTypeRecieved) {
    case MessageType.ASK_FOR_INITIALISATION:
      return notifyOwnDataForInitialisation;
    case MessageType.DATA_FOR_INITIALISATION:
      return initialiseOwnStateIfNotAlreadyInitialised;
    case MessageType.DATA_UPDATE:
      return ({ setState }) => [setState, [setState]];
  }
}

const allMessageTypes: MessageType[] = [
  MessageType.DATA_UPDATE,
  MessageType.DATA_FOR_INITIALISATION,
  MessageType.ASK_FOR_INITIALISATION,
];

export function useTabsState<State>(initialState: InitialState<State>, key: string): UseStateReturn<State> {
  const useStateReturn: UseStateReturn<State> = useState<State>(initialState);
  const [state, setState]: UseStateReturn<State> = useStateReturn;

  const actionOnEventParams: ActionOnEventParams<State> = {
    key,
    state,
    setState,
  };

  allMessageTypes.forEach(messageType => registerActionForMessage(actionOnEventParams, messageType));

  useNotifyInitialisationForOtherTabs(key);

  const setStateAndNotify = buildSetStateAndNotify(useStateReturn, key);

  return [state, setStateAndNotify];
}

function registerActionForMessage<State>(
  actionOnEventParams: ActionOnEventParams<State>,
  messageType: MessageType
): void {
  const [listener, dpendencies] = getActionOnEvent<State>(messageType)(actionOnEventParams);
  useLayoutEffect(() => {
    const registeredListener = addListenerOnStorage(actionOnEventParams.key, messageType, listener);
    return () => removeListenerOnStorage(registeredListener);
  }, dpendencies);
}

function useNotifyInitialisationForOtherTabs(key: string): void {
  useLayoutEffect(() => {
    notifyWithLocalStorage(key, MessageType.ASK_FOR_INITIALISATION, "storage initialisation");
  }, []);
}

function buildSetStateAndNotify<State>([previousState, setState]: UseStateReturn<State>, key: string): SetState<State> {
  return (stateUpdater: SetStateAction<State>) => {
    const stateUpdaterIsFunction = stateUpdater instanceof Function;
    const newState: State = stateUpdaterIsFunction ? stateUpdater(previousState) : stateUpdater;
    notifyWithLocalStorage(key, MessageType.DATA_UPDATE, newState);
    setState(stateUpdater);
  };
}
