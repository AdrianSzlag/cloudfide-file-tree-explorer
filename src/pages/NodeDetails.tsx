import { Link } from 'react-router-dom';
import { CornerLeftUp } from 'lucide-react';
import {
  formatSize,
  nodePath,
  nodeUrl,
  type TreeModel,
  type TreeNode,
} from '../features/file-tree/model/tree';
import { NodeIcon } from '../features/file-tree/components/NodeIcon';
import styles from './NodeDetails.module.scss';

interface NodeDetailsProps {
  model: TreeModel;
  node: TreeNode | undefined;
  suffix: string;
}

export function NodeDetails({ model, node, suffix }: NodeDetailsProps) {
  return (
    <section className={`panel ${styles.details}`} aria-label="Node details">
      {node ? (
        <>
          <p className="eyebrow">{node.type === 'file' ? 'FILE DETAILS' : 'FOLDER DETAILS'}</p>
          <h2 className={styles.nodeHeading}>
            <NodeIcon node={node} />
            {node.name}
          </h2>
          <dl>
            <dt>Full path</dt>
            <dd className={styles.path}>{nodePath(model, node.id)}</dd>
            <dt>{node.type === 'file' ? 'Size' : 'Total file size'}</dt>
            <dd>{formatSize(node.size)}</dd>
            {node.type === 'folder' && (
              <>
                <dt>Direct children</dt>
                <dd>{node.children.length}</dd>
              </>
            )}
          </dl>
          {node.type === 'file' && node.parent !== null && (
            <Link to={nodeUrl(model, node.parent) + suffix}>Back to parent folder</Link>
          )}
          {node.type === 'folder' && (
            <div className={styles.children}>
              <h3>Folder contents</h3>
              <ul>
                {node.parent !== null && (
                  <li>
                    <Link
                      to={nodeUrl(model, node.parent) + suffix}
                      aria-label="Parent folder"
                      title="Go to parent folder"
                    >
                      <CornerLeftUp size={17} strokeWidth={1.6} aria-hidden="true" />
                      <span>..</span>
                    </Link>
                  </li>
                )}
                {node.children.map((id) => {
                  const child = model.nodes[id]!;
                  return (
                    <li key={id}>
                      <Link to={nodeUrl(model, id) + suffix}>
                        <NodeIcon node={child} />
                        <span>{child.name}</span>
                        <small>{formatSize(child.size)}</small>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {node.children.length === 0 && <p className="muted">This folder is empty.</p>}
            </div>
          )}
        </>
      ) : (
        <>
          <h2>Node not found</h2>
          <p>This path does not exist in the imported tree.</p>
          <Link to="/tree">Back to root</Link>
        </>
      )}
    </section>
  );
}
