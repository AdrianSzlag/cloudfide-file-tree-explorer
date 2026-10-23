import { describe, expect, it } from 'vitest';
import { findNode, formatSize, MAX_BYTES, nodePath, parseTree, searchTree } from './tree';
const source = JSON.stringify({
  name: 'root',
  type: 'folder',
  children: [
    { name: 'src', type: 'folder', children: [{ name: 'Button.tsx', type: 'file', size: 1536 }] },
    { name: 'empty', type: 'folder', children: [] },
    { name: 'readme.md', type: 'file', size: 512 },
  ],
});
describe('tree model', () => {
  it('indexes children and aggregates subtree sizes', () => {
    const model = parseTree(source);
    expect(model.nodes[0]?.size).toBe(2048);
    expect(findNode(model, 'root/src')?.size).toBe(1536);
    expect(model.nodes[0]?.children).toHaveLength(3);
    expect(findNode(model, 'root/empty')?.size).toBe(0);
    expect(nodePath(model, 2)).toBe('root/src/Button.tsx');
    expect(findNode(model, 'root/missing')).toBeUndefined();
  });
  it('searches all descendants without case sensitivity', () => {
    expect(searchTree(parseTree(source), ' BUTton ')).toHaveLength(1);
    expect(searchTree(parseTree(source), ' ')).toEqual([]);
  });
  it.each([
    [0, '0 B'],
    [1023, '1023 B'],
    [1024, '1 KB'],
    [1536, '1.5 KB'],
    [1048576, '1 MB'],
  ] as const)('formats %s bytes', (size, expected) => expect(formatSize(size)).toBe(expected));
  it.each([
    '{',
    'null',
    '[]',
    '{"name":"root","type":"folder"}',
    '{"name":"root","type":"file","size":0}',
  ])('rejects malformed input: %s', (text) => expect(() => parseTree(text)).toThrow());
  it.each([
    {
      rule: 'path separators',
      children: [{ name: 'bad/name', type: 'file', size: 1 }],
      error: 'Node names',
    },
    {
      rule: 'parent traversal',
      children: [{ name: '..', type: 'file', size: 1 }],
      error: 'Node names',
    },
    {
      rule: 'negative sizes',
      children: [{ name: 'a', type: 'file', size: -1 }],
      error: 'File sizes',
    },
    {
      rule: 'fractional sizes',
      children: [{ name: 'a', type: 'file', size: 1.1 }],
      error: 'File sizes',
    },
    {
      rule: 'children on files',
      children: [{ name: 'a', type: 'file', size: 1, children: [] }],
      error: 'Files cannot have children',
    },
    {
      rule: 'duplicate siblings',
      children: [
        { name: 'a', type: 'file', size: 1 },
        { name: 'a', type: 'folder', children: [] },
      ],
      error: 'unique names',
    },
    {
      rule: 'aggregate overflow',
      children: [
        { name: 'a', type: 'file', size: Number.MAX_SAFE_INTEGER },
        { name: 'b', type: 'file', size: 1 },
      ],
      error: 'total size',
    },
  ])('rejects $rule', ({ children, error }) => {
    expect(() => parseTree(JSON.stringify({ name: 'root', type: 'folder', children }))).toThrow(
      error,
    );
  });
  it('enforces import size and node limits', () => {
    expect(() => parseTree(' '.repeat(MAX_BYTES + 1))).toThrow('2 MB');
    expect(() =>
      parseTree(
        JSON.stringify({
          name: 'root',
          type: 'folder',
          children: Array.from({ length: 10000 }, (_, i) => ({
            name: String(i),
            type: 'file',
            size: 0,
          })),
        }),
      ),
    ).toThrow('10,000');
  });
  it('rejects malformed Unicode before creating navigation links', () => {
    const input = JSON.stringify({
      name: 'root',
      type: 'folder',
      children: [{ name: '\uD800', type: 'file', size: 0 }],
    });
    expect(() => parseTree(input)).toThrow('valid Unicode');
  });
  it('supports deep input without recursive traversal', () => {
    let json = '{"name":"leaf","type":"file","size":1}';
    for (let i = 0; i < 2000; i++) json = `{"name":"f${i}","type":"folder","children":[${json}]}`;
    expect(parseTree(json).nodes[0]?.size).toBe(1);
  });
});
