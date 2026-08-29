import { useCallback, useEffect, useSyncExternalStore } from "react";
import { dispatch, getState, startLoop, subscribe } from "../engine/store";
import type { Action, HassState } from "../engine/types";

export function useHass(): HassState & { dispatch: (action: Action) => void } {
  const state = useSyncExternalStore(subscribe, getState, getState);

  useEffect(() => startLoop(), []);

  const send = useCallback((action: Action) => {
    dispatch(action);
  }, []);

  return { ...state, dispatch: send };
}
