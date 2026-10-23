import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { nodePath, searchTree, type TreeModel } from '../features/file-tree/model/tree';
import { NodeIcon } from '../features/file-tree/components/NodeIcon';
import styles from './Pages.module.scss';

const PAGE_SIZE = 100;

export function SearchResults({ model, query }: { model: TreeModel; query: string }) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const matches = useMemo(() => searchTree(model, query), [model, query]);
  // Build paths only for displayed results, once per row. Avoid caching every
  // full path in the model: a deep chain would require quadratic storage.
  const rows = useMemo(
    () => matches.slice(0, limit).map((node) => ({ node, path: nodePath(model, node.id) })),
    [model, matches, limit],
  );
  const suffix = `?${new URLSearchParams({ q: query })}`;
  return (
    <>
      <p className="muted" role="status">
        {matches.length} {matches.length === 1 ? 'result' : 'results'}
      </p>
      <ul className={styles.results}>
        {rows.map(({ node, path }) => (
          <li key={node.id}>
            <Link to={`/tree/${encodeURIComponent(path)}${suffix}`}>
              <NodeIcon node={node} />
              <span>
                <strong>{node.name}</strong>
                <small>{path}</small>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {matches.length === 0 && <p>No matching files or folders.</p>}
      {rows.length < matches.length && (
        <button
          className="button secondary"
          onClick={() => setLimit((current) => current + PAGE_SIZE)}
        >
          Show more results ({rows.length} of {matches.length})
        </button>
      )}
    </>
  );
}
