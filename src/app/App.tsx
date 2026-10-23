import { Link, Route, Routes } from 'react-router-dom';
import { FolderTree } from 'lucide-react';
import { TreeProvider, useTree } from '../features/file-tree/model/TreeProvider';
import { ImportPage } from '../pages/ImportPage';
import { ExplorerPage } from '../pages/ExplorerPage';
import styles from './App.module.scss';

function Layout() {
  const { loading, notice, model } = useTree();
  return (
    <>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <FolderTree size={22} />
          <span>
            FileTree <strong>Explorer</strong>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/">Import JSON</Link>
          {model && <Link to="/tree">Explorer</Link>}
        </nav>
      </header>
      <main className={styles.main}>
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        {loading ? (
          <p role="status">Restoring your workspace…</p>
        ) : (
          <Routes>
            <Route path="/" element={<ImportPage />} />
            <Route path="/tree" element={<ExplorerPage />} />
            <Route path="/tree/:nodePath" element={<ExplorerPage />} />
            <Route
              path="*"
              element={
                <section className="panel">
                  <h1>Page not found</h1>
                  <Link to="/">Return to import</Link>
                </section>
              }
            />
          </Routes>
        )}
      </main>
      <footer className={styles.footer}>Your JSON stays in this browser.</footer>
    </>
  );
}
export function App() {
  return (
    <TreeProvider>
      <Layout />
    </TreeProvider>
  );
}
