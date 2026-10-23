import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { nodeUrl, type TreeModel } from '../model/tree';
import { NodeIcon } from './NodeIcon';
import styles from './Tree.module.scss';

interface TreeViewProps {
  model: TreeModel;
  selected?: number;
  expanded: ReadonlySet<number>;
  onToggle: (id: number) => void;
}

export const TreeView = memo(function TreeView({
  model,
  selected,
  expanded,
  onToggle,
}: TreeViewProps) {
  const visible = useMemo(() => {
    const rows: { id: number; depth: number; url: string }[] = [];
    const pending = [{ id: 0, depth: 0 }];
    while (pending.length) {
      const row = pending.pop()!;
      rows.push({ ...row, url: nodeUrl(model, row.id) });
      if (expanded.has(row.id)) {
        const children = model.nodes[row.id]!.children;
        for (let i = children.length - 1; i >= 0; i--)
          pending.push({ id: children[i]!, depth: row.depth + 1 });
      }
    }
    return rows;
  }, [model, expanded]);
  return (
    <ul className={styles.tree} aria-label="Files and folders">
      {visible.map(({ id, depth, url }) => {
        const node = model.nodes[id]!;
        const open = expanded.has(id);
        return (
          <li
            key={id}
            className={styles.row}
            style={{ paddingInlineStart: `${Math.min(depth, 12) * 16}px` }}
          >
            {node.type === 'folder' ? (
              <button
                className={styles.toggle}
                aria-label={`${open ? 'Collapse' : 'Expand'} ${node.name}`}
                aria-expanded={open}
                onClick={() => onToggle(id)}
              >
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className={styles.spacer} />
            )}
            <Link aria-current={selected === id ? 'page' : undefined} to={url}>
              <NodeIcon node={node} open={open} />
              <span>{node.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
});
