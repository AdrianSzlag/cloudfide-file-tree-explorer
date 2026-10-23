export const MAX_BYTES = 2 * 1024 * 1024;
export const MAX_NODES = 10_000;
export interface TreeNode {
  id: number;
  name: string;
  type: 'file' | 'folder';
  parent: number | null;
  children: number[];
  size: number;
}
export interface TreeModel {
  nodes: TreeNode[];
}

// Iterative validation and indexing avoid recursion limits on deeply nested input.
export function parseTree(text: string): TreeModel {
  if (new TextEncoder().encode(text).length > MAX_BYTES)
    throw new Error('JSON must be 2 MB or smaller.');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON. Check commas, quotes and brackets.');
  }
  const nodes: TreeNode[] = [];
  const stack: { value: unknown; parent: number | null }[] = [{ value, parent: null }];
  while (stack.length) {
    const item = stack.pop()!;
    if (nodes.length >= MAX_NODES)
      throw new Error('The tree must contain no more than 10,000 nodes.');
    if (!item.value || typeof item.value !== 'object' || Array.isArray(item.value))
      throw new Error('Each node must be an object.');
    const input = item.value as Record<string, unknown>;
    if (
      typeof input.name !== 'string' ||
      !input.name.trim() ||
      /[/\\\u0000-\u001f]/.test(input.name) ||
      ['.', '..'].includes(input.name)
    ) {
      throw new Error(
        'Node names must be non-empty and cannot contain slashes, control characters, "." or "..".',
      );
    }
    // JSON permits lone UTF-16 surrogates; URL encoding does not.
    try {
      encodeURIComponent(input.name);
    } catch {
      throw new Error('Node names must contain valid Unicode.');
    }
    if (input.type !== 'file' && input.type !== 'folder')
      throw new Error('Each node must have type "file" or "folder".');
    if (item.parent === null && input.type !== 'folder')
      throw new Error('The root node must be a folder.');
    if (input.type === 'file' && (!Number.isSafeInteger(input.size) || (input.size as number) < 0))
      throw new Error('File sizes must be non-negative safe integers.');
    if (input.type === 'file' && input.children !== undefined)
      throw new Error('Files cannot have children.');
    if (input.type === 'folder' && !Array.isArray(input.children))
      throw new Error('Folders must have a children array.');
    const node: TreeNode = {
      id: nodes.length,
      name: input.name,
      type: input.type,
      parent: item.parent,
      children: [],
      size: input.type === 'file' ? (input.size as number) : 0,
    };
    nodes.push(node);
    if (item.parent !== null) nodes[item.parent]!.children.push(node.id);
    if (input.type === 'folder') {
      const children = input.children as unknown[];
      const names = new Set<unknown>();
      for (const child of children) {
        const name =
          child && typeof child === 'object' ? (child as Record<string, unknown>).name : undefined;
        if (names.has(name)) throw new Error('Children in the same folder must have unique names.');
        names.add(name);
      }
      for (let i = children.length - 1; i >= 0; i--)
        stack.push({ value: children[i], parent: node.id });
    }
  }
  for (let i = nodes.length - 1; i > 0; i--) {
    const node = nodes[i]!;
    const parent = nodes[node.parent!]!;
    parent.size += node.size;
    if (!Number.isSafeInteger(parent.size))
      throw new Error('The total size exceeds the supported integer range.');
  }
  return { nodes };
}

export function nodePath(model: TreeModel, id: number): string {
  const segments: string[] = [];
  let node: TreeNode | undefined = model.nodes[id];
  while (node) {
    segments.push(node.name);
    node = node.parent === null ? undefined : model.nodes[node.parent];
  }
  return segments.reverse().join('/');
}
export function nodeUrl(model: TreeModel, id: number): string {
  return `/tree/${encodeURIComponent(nodePath(model, id))}`;
}
export function findNode(model: TreeModel, path: string): TreeNode | undefined {
  const names = path.split('/');
  let node = model.nodes[0];
  if (names.shift() !== node?.name) return undefined;
  for (const name of names) {
    const childId = node?.children.find((id) => model.nodes[id]!.name === name);
    if (childId === undefined) return undefined;
    node = model.nodes[childId];
  }
  return node;
}
export function searchTree(model: TreeModel, query: string): TreeNode[] {
  const needle = query.trim().toLowerCase();
  return needle ? model.nodes.filter((node) => node.name.toLowerCase().includes(needle)) : [];
}
export function formatSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Number((size / 1024).toFixed(2))} KB`;
  return `${Number((size / (1024 * 1024)).toFixed(2))} MB`;
}

export function pathFromLocation(pathname: string): string | undefined {
  if (pathname === '/tree' || pathname === '/tree/') return undefined;
  // Decode exactly once; Router v6 params normalize literal %2F names.
  try {
    return decodeURIComponent(pathname.replace(/\/$/, '').slice('/tree/'.length));
  } catch {
    return '';
  }
}
