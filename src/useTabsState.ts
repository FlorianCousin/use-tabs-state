import { Dispatch, SetStateAction, useLayoutEffect, useState } from "react";
import { addListenerOnStorage, MessageType, notifyWithLocalStorage, removeListenerOnStorage } from "./messages";

export type InitialState<State> = State | (() => State);
export type SetState<State> = Dispatch<SetStateAction<State>>;
export type UseStateReturn<State> = [State, SetState<State>];

export function useTabsState<State>(initialState: InitialState<State>, key: string): UseStateReturn<State> {
  const useStateReturn: UseStateReturn<State> = useState<State>(initialState);
  const [state, setState]: UseStateReturn<State> = useStateReturn;

  useRegisterInitStorageListener<State>(key, state);

  useRegisterStateStorageListener<State>(key, setState);

  useNotifyInitialisationForOtherTabs(key);

  const setStateAndNotify = buildSetStateAndNotify(useStateReturn, key);

  return [state, setStateAndNotify];
}

function useRegisterInitStorageListener<State>(key: string, state: State): void {
  useLayoutEffect(() => {
    const onNewTabInitRequest = () => notifyWithLocalStorage(key, MessageType.DATA_INITIALISATION, state);
    const registeredListener = addListenerOnStorage(key, MessageType.ASK_FOR_INITIALISATION, onNewTabInitRequest);
    return () => removeListenerOnStorage(registeredListener);
  }, [state]);
}

function useRegisterStateStorageListener<State>(key: string, setState: SetState<State>) {
  useLayoutEffect(() => {
    const registeredListener = addListenerOnStorage(key, MessageType.DATA_UPDATE, setState);
    return () => removeListenerOnStorage(registeredListener);
  }, []);
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
