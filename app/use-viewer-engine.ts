'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type ViewerEngine<State> = {
  update: (state: State) => void;
  dispose: () => void;
};

const webglError =
  'WebGL could not start. Enable graphics acceleration in your browser, then reload the viewer.';

type ViewerFactory<State, Callbacks, Engine> = (
  host: HTMLDivElement,
  initial: State,
  callbacks: Callbacks,
) => Engine;

/** Own the shared lazy-load, update, failure, and disposal lifecycle. */
export function useViewerEngine<
  State,
  Bindings,
  Callbacks,
  Engine extends ViewerEngine<State>,
>(
  state: State,
  bindings: Bindings,
  load: () => Promise<ViewerFactory<State, Callbacks, Engine>>,
  createCallbacks: (
    current: () => Bindings,
    reportError: (message: string) => void,
  ) => Callbacks,
  loadError: string,
) {
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<Engine | null>(null),
    latest = useRef({ state, bindings }),
    setup = useRef({ load, createCallbacks, loadError });
  const [error, setError] = useState(''),
    [ready, setReady] = useState(false);

  useEffect(() => {
    latest.current = { state, bindings };
  });
  useEffect(() => engine.current?.update(state), [state]);

  useLayoutEffect(() => {
    let stopped = false;
    void setup.current
      .load()
      .then((create) => {
        if (stopped || !host.current) return;
        try {
          engine.current = create(
            host.current,
            latest.current.state,
            setup.current.createCallbacks(
              () => latest.current.bindings,
              setError,
            ),
          );
          setReady(true);
        } catch {
          setError(webglError);
        }
      })
      .catch(() => {
        if (!stopped) setError(setup.current.loadError);
      });
    return () => {
      stopped = true;
      const current = engine.current;
      engine.current = null;
      current?.dispose();
    };
  }, []);

  return { host, error, ready };
}
