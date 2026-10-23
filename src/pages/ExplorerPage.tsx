import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTree } from '../features/file-tree/model/TreeProvider';
import { findNode, pathFromLocation } from '../features/file-tree/model/tree';
import { TreeView } from '../features/file-tree/components/TreeView';
import { SearchResults } from './SearchResults';
import styles from './Pages.module.scss';
import { NodeDetails } from './NodeDetails';

export function ExplorerPage() {
  const { model } = useTree();
  const selectedPath = pathFromLocation(useLocation().pathname);
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const selected = useMemo(
    () =>
      model
        ? selectedPath !== undefined
          ? findNode(model, selectedPath)
          : model.nodes[0]
        : undefined,
    [model, selectedPath],
  );
  const selectedId = selected?.id;
  const [expanded, setExpanded] = useState(() => new Set([0]));
  useEffect(() => {
    if (!model || selectedId === undefined) return;
    setExpanded((current) => {
      const next = new Set(current);
      let parent = model.nodes[selectedId]!.parent;
      while (parent !== null) {
        next.add(parent);
        parent = model.nodes[parent]!.parent;
      }
      return next.size === current.size ? current : next;
    });
  }, [model, selectedId]);
  const toggleFolder = useCallback((id: number) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (!model)
    return (
      <section className="panel">
        <h1>No tree imported yet</h1>
        <p>Import a JSON structure to start exploring.</p>
        <Link to="/">Import JSON</Link>
      </section>
    );
  const suffix = query ? `?${new URLSearchParams({ q: query })}` : '';
  return (
    <>
      <div className={styles.sectionHeading}>
        <div>
          <p className="eyebrow">WORKSPACE</p>
          <h1>File explorer</h1>
        </div>
        <span className="muted">{model.nodes.length} nodes</span>
      </div>
      <div className={styles.explorer}>
        <aside className={`panel ${styles.sidebar}`} aria-label="Workspace browser">
          <label htmlFor="search">Search files and folders</label>
          <div className={styles.search}>
            <Search size={16} aria-hidden="true" />
            <input
              id="search"
              placeholder="Search by name…"
              value={query}
              onChange={(event) =>
                setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })
              }
            />
          </div>
          {query.trim() ? (
            <SearchResults key={query} model={model} query={query} />
          ) : (
            <TreeView
              model={model}
              selected={selectedId}
              expanded={expanded}
              onToggle={toggleFolder}
            />
          )}
        </aside>
        <NodeDetails model={model} node={selected} suffix={suffix} />
      </div>
    </>
  );
}
