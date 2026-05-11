import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { createSeedData, normalizeResosData, replaceCollection, SecurityValidationError, WORKSPACE_SLUG } from './dataShape.js';
import { supabase } from './supabaseClient.js';

const DataContext = createContext(null);

function publicDataError(error) {
  if (error instanceof SecurityValidationError) return error.message;
  if (error?.code === '42501' || error?.code === 'PGRST301') return 'You do not have access to this restaurant workspace.';
  if (error?.code === '28000') return 'Please sign in again to access this workspace.';
  if (error?.code === '22023' || error?.code === '23514') return 'The workspace data did not pass security validation.';
  return 'ResOS could not complete that workspace request.';
}

export function ResosDataProvider({ children }) {
  const { session } = useAuth();
  const [workspaceId, setWorkspaceId] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const dataRef = useRef(null);
  const pendingSavesRef = useRef(0);
  const saveQueueRef = useRef(Promise.resolve());

  const loadWorkspace = useCallback(async () => {
    if (!session || !supabase) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: existingWorkspace, error: selectError } = await supabase
        .rpc('ensure_restaurant_workspace', {
          p_seed_data: createSeedData(),
          p_slug: WORKSPACE_SLUG,
        })
        .single();

      if (selectError) throw selectError;

      const normalizedData = normalizeResosData(existingWorkspace.data);
      setWorkspaceId(existingWorkspace.id);
      dataRef.current = normalizedData;
      setData(normalizedData);
      setVersion((current) => current + 1);
    } catch (loadError) {
      setError(publicDataError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const persistData = useCallback((nextData) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    let normalizedData;
    try {
      normalizedData = normalizeResosData(nextData);
    } catch (validationError) {
      setError(publicDataError(validationError));
      throw validationError;
    }

    dataRef.current = normalizedData;
    setData(normalizedData);
    setVersion((current) => current + 1);
    pendingSavesRef.current += 1;
    setIsSaving(true);
    setError(null);

    const savePromise = saveQueueRef.current.catch(() => {}).then(async () => {
      const latestData = dataRef.current || normalizedData;
      const { data: savedWorkspace, error: saveError } = await supabase
        .rpc('save_restaurant_workspace_data', {
          p_data: latestData,
          p_slug: WORKSPACE_SLUG,
        })
        .single();

      if (saveError) throw saveError;

      const savedData = normalizeResosData(savedWorkspace.data);
      setWorkspaceId(savedWorkspace.id);
      if (dataRef.current === latestData) {
        dataRef.current = savedData;
        setData(savedData);
      }
      return savedData;
    });

    saveQueueRef.current = savePromise;

    return savePromise
      .catch((saveError) => {
        setError(publicDataError(saveError));
        throw saveError;
      })
      .finally(() => {
        pendingSavesRef.current = Math.max(0, pendingSavesRef.current - 1);
        if (pendingSavesRef.current === 0) setIsSaving(false);
      });
  }, []);

  const saveAllData = useCallback((nextData) => persistData(nextData), [persistData]);

  const saveCollection = useCallback(async (key, value) => {
    const baseData = dataRef.current || data || createSeedData();
    const savedData = await persistData(replaceCollection(baseData, key, value));
    return savedData[key];
  }, [data, persistData]);

  const resetDemoData = useCallback(() => persistData(createSeedData()), [persistData]);

  const exportCsvBackup = useCallback(async () => {
    const { createCsvBackup } = await import('./csvBackup.js');
    return createCsvBackup(data || createSeedData());
  }, [data]);

  const importCsvBackup = useCallback(async (file) => {
    const { parseCsvBackup } = await import('./csvBackup.js');
    const result = await parseCsvBackup(file);
    await persistData(result.data);
    return result;
  }, [persistData]);

  const value = useMemo(() => ({
    data,
    error,
    exportCsvBackup,
    importCsvBackup,
    isLoading,
    isSaving,
    reloadWorkspace: loadWorkspace,
    resetDemoData,
    saveAllData,
    saveCollection,
    version,
    workspaceId,
  }), [
    data,
    error,
    exportCsvBackup,
    importCsvBackup,
    isLoading,
    isSaving,
    loadWorkspace,
    resetDemoData,
    saveAllData,
    saveCollection,
    version,
    workspaceId,
  ]);

  if (isLoading && !data) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Loading</p>
          <h1>Opening ResOS</h1>
          <p className="muted">Loading the shared restaurant workspace.</p>
        </section>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Workspace Error</p>
          <h1>ResOS could not load data</h1>
          <p className="muted">{error}</p>
          <button className="button button-primary" type="button" onClick={loadWorkspace}>Try Again</button>
        </section>
      </main>
    );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useResosData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useResosData must be used inside ResosDataProvider.');
  }
  return context;
}
