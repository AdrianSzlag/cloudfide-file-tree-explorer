import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Upload } from 'lucide-react';
import { useTree } from '../features/file-tree/model/TreeProvider';
import { MAX_BYTES } from '../features/file-tree/model/tree';
import styles from './Pages.module.scss';

export function ImportPage() {
  const [json, setJson] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { importTree, model } = useTree();
  const navigate = useNavigate();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await importTree(json);
      navigate('/tree');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Import failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    if (file.size > MAX_BYTES) {
      setError('JSON must be 2 MB or smaller.');
      return;
    }
    setBusy(true);
    try {
      setJson(await file.text());
    } catch {
      setError('Could not read this file. Please select it again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.importPage}>
      <div className={styles.intro}>
        <p className="eyebrow">YOUR PROJECT, AT A GLANCE</p>
        <h1>Explore your file structure.</h1>
        <p>Import a JSON tree to browse folders, inspect files and find what you need.</p>
      </div>
      <form className="panel" onSubmit={submit}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Import a tree</h2>
            <p>Paste JSON below or choose a file.</p>
          </div>
          <label className={`button secondary ${styles.upload}`}>
            <Upload size={16} />
            Choose file
            <input
              type="file"
              accept=".json,application/json"
              aria-label="Choose JSON file"
              disabled={busy}
              onChange={upload}
            />
          </label>
        </div>
        <label htmlFor="json">JSON structure</label>
        <textarea
          id="json"
          value={json}
          onChange={(event) => setJson(event.target.value)}
          spellCheck={false}
          placeholder={'{\n  "name": "root",\n  "type": "folder",\n  "children": []\n}'}
          aria-describedby="json-help import-error"
          disabled={busy}
        />
        <div className={styles.help}>
          <span id="json-help">Maximum 2 MB · 10,000 nodes</span>
          <a href="/example.json" download>
            Download example
          </a>
        </div>
        <div id="import-error">
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </div>
        <div className={styles.actions}>
          <button className="button" disabled={busy || !json.trim()}>
            {busy ? 'Importing…' : 'Open explorer'}
            <ArrowRight size={16} />
          </button>
          {model && <Link to="/tree">Continue with saved tree</Link>}
        </div>
      </form>
    </div>
  );
}
