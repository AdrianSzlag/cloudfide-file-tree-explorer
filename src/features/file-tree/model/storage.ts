import { get, set, del } from 'idb-keyval';
const KEY = 'file-tree-json-v1';
export const storage = {
  read: () => get<unknown>(KEY),
  write: (json: string) => set(KEY, json),
  clear: () => del(KEY),
};
