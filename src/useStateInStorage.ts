import { Dispatch, SetStateAction, useLayoutEffect, useState } from "react";

type Listener<Value> = (value: Value) => void;
type StorageListener = Listener<StorageEvent>;

export type InitialState<State> = State | (() => State);
export type SetState<State> = Dispatch<SetStateAction<State>>;
export type UseStateReturn<State> = [State, SetState<State>];

export function useTabsState<State>(initialState: InitialState<State>, storageKey: string): UseStateReturn<State> {
  const [state, setState]: UseStateReturn<State> = useState<State>(initialState);

  useRegisterInitStorageListener<State>(storageKey, state);

  useRegisterStateStorageListener<State>(storageKey, setState);

  useNotifyInitialisationForOtherTabs(storageKey);

  const useStateReturn: UseStateReturn<State> = [state, setState];
  const setStateInStorage = buildSetStateInStorage(useStateReturn, storageKey);

  return [state, setStateInStorage];
}

function useRegisterInitStorageListener<State>(storageKey: string, state: State): void {
  useLayoutEffect(() => {
    const initStorageKey: string = buildInitStorageKey(storageKey);
    const onInitStorageChange = () => {
      notifyWithLocalStorage(storageKey, state);
    };
    const registeredListener = addListenerOnStorageKey(initStorageKey, onInitStorageChange);
    return () => window.removeEventListener("storage", registeredListener);
  }, [state]);
}

function useRegisterStateStorageListener<State>(storageKey: string, setState: SetState<State>) {
  useLayoutEffect(() => {
    const registeredListener = addListenerOnStorageKey(storageKey, setState);
    return () => window.removeEventListener("storage", registeredListener);
  }, []);
}

function useNotifyInitialisationForOtherTabs(storageKey: string): void {
  useLayoutEffect(() => {
    const initStorageKey: string = buildInitStorageKey(storageKey);
    notifyWithLocalStorage(initStorageKey, "storage initialisation");
  }, []);
}

function buildSetStateInStorage<State>(
  [previousState, setState]: UseStateReturn<State>,
  storageKey: string
): SetState<State> {
  return (stateUpdater: SetStateAction<State>) => {
    const stateUpdaterIsFunction = stateUpdater instanceof Function;
    const newState: State = stateUpdaterIsFunction ? stateUpdater(previousState) : stateUpdater;
    notifyWithLocalStorage(storageKey, newState);
    setState(stateUpdater);
  };
}

function notifyWithLocalStorage<Value>(storageKey: string, value: Value): void {
  localStorage.setItem(storageKey, JSON.stringify(value));
  localStorage.removeItem(storageKey);
}

function addListenerOnStorageKey<Value>(storageKey: string, listener: Listener<Value>): StorageListener {
  const wrappedListener = wrapListenerForKey<Value>(storageKey, listener);
  window.addEventListener("storage", wrappedListener);
  return wrappedListener;
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

function buildInitStorageKey(storageKey: string): string {
  return `${storageKey}-init`;
}
