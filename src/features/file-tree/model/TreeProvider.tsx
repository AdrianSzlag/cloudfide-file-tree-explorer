import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { parseTree, type TreeModel } from './tree';
import { storage } from './storage';

interface TreeState {
  model: TreeModel | null;
  loading: boolean;
  notice: string;
  importTree: (json: string) => Promise<void>;
}
const Context = createContext<TreeState | null>(null);
export function TreeProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<TreeModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const saved = await storage.read();
        if (saved !== undefined) {
          if (typeof saved !== 'string') throw new Error('Invalid saved data');
          const restored = parseTree(saved);
          if (active) setModel(restored);
        }
      } catch {
        if (active) setNotice('Saved data could not be restored. Import a JSON file to continue.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, []);
  async function importTree(json: string) {
    const next = parseTree(json);
    // A failed save must not silently leave a previous tree to restore on refresh.
    try {
      await storage.write(json);
    } catch {
      throw new Error(
        'Could not save the tree in this browser. Free storage or enable site storage and try again.',
      );
    }
    setModel(next);
    setNotice('');
  }
  return (
    <Context.Provider value={{ model, loading, notice, importTree }}>{children}</Context.Provider>
  );
}
export function useTree() {
  const value = useContext(Context);
  if (!value) throw new Error('TreeProvider is required');
  return value;
}
