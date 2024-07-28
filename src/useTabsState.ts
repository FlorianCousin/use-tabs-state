import { Dispatch, SetStateAction, useLayoutEffect, useState } from "react";
import { notify } from "./messages";
import { useAllEventsSubscription } from "./useAllEventsSubscription";
import { EventType } from "./eventsTypes";

export type SetState<State> = Dispatch<SetStateAction<State>>;
export type UseStateReturn<State> = [State, SetState<State>];
export type InitialState<State> = State | (() => State);

export function useTabsState<State>(initialState: InitialState<State>, key: string): UseStateReturn<State> {
  const useStateReturn: UseStateReturn<State> = useState<State>(initialState);
  const [state, setState]: UseStateReturn<State> = useStateReturn;

  useAllEventsSubscription({
    key,
    state,
    setState,
  });

  useNotifyInitialisationForOtherTabs(key);

  const setStateAndNotify = buildSetStateAndNotify(useStateReturn, key);

  return [state, setStateAndNotify];
}

function useNotifyInitialisationForOtherTabs(key: string): void {
  useLayoutEffect(() => {
    notify(key, EventType.ASK_FOR_INITIALISATION, "storage initialisation");
  }, []);
}

function buildSetStateAndNotify<State>([previousState, setState]: UseStateReturn<State>, key: string): SetState<State> {
  return (stateUpdater: SetStateAction<State>) => {
    const stateUpdaterIsFunction = stateUpdater instanceof Function;
    const newState: State = stateUpdaterIsFunction ? stateUpdater(previousState) : stateUpdater;
    notify(key, EventType.DATA_UPDATE, newState);
    setState(stateUpdater);
  };
}
