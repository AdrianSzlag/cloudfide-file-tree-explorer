import { File, FileCode2, Folder, FolderOpen } from 'lucide-react';
import type { TreeNode } from '../model/tree';
import styles from './Tree.module.scss';
export function NodeIcon({ node, open = false }: { node: TreeNode; open?: boolean }) {
  const extension = node.name.split('.').pop()?.toLowerCase();
  const known =
    node.name.includes('.') &&
    ['tsx', 'ts', 'jsx', 'js', 'json', 'scss', 'css', 'md', 'html'].includes(extension ?? '');
  const Icon = node.type === 'folder' ? (open ? FolderOpen : Folder) : known ? FileCode2 : File;
  return (
    <span className={styles.icon} aria-hidden="true">
      <Icon size={17} strokeWidth={1.6} />
      {node.type === 'file' && known && <span>{extension}</span>}
    </span>
  );
}
