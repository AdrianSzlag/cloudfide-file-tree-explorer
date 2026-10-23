import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { storage } from '../features/file-tree/model/storage';
import { nodeUrl, parseTree } from '../features/file-tree/model/tree';

const json = JSON.stringify({
  name: 'root',
  type: 'folder',
  children: [
    { name: 'src', type: 'folder', children: [{ name: 'Button.tsx', type: 'file', size: 512 }] },
    { name: 'empty', type: 'folder', children: [] },
  ],
});
function mount(path = '/') {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>,
  );
}
beforeEach(async () => {
  vi.restoreAllMocks();
  await storage.clear();
});

describe('explorer', () => {
  it('imports pasted JSON, expands folders and navigates to details', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByLabelText('JSON structure'));
    await user.paste(json);
    await user.click(screen.getByRole('button', { name: 'Open explorer' }));
    await user.click(await screen.findByRole('button', { name: 'Expand src' }));
    await user.click(screen.getByRole('link', { name: /Button.tsx/ }));
    const details = screen.getByRole('region', { name: 'Node details' });
    expect(within(details).getByText('root/src/Button.tsx')).toBeInTheDocument();
    expect(within(details).getByText('512 B')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Collapse src' }));
    expect(screen.queryByRole('link', { name: /Button.tsx/ })).not.toBeInTheDocument();
  });
  it('keeps expanded folders when search is cleared', async () => {
    await storage.write(json);
    const user = userEvent.setup();
    mount('/tree');
    await user.click(await screen.findByRole('button', { name: 'Expand src' }));
    const search = screen.getByLabelText('Search files and folders');
    await user.type(search, 'missing');
    await user.clear(search);
    expect(screen.getByRole('button', { name: 'Collapse src' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Button.tsx/ })).toBeVisible();
  });
  it('reveals the ancestors of a deep link and still allows manual collapse', async () => {
    await storage.write(json);
    const user = userEvent.setup();
    mount('/tree/root%2Fsrc%2FButton.tsx');
    const file = await screen.findByRole('link', { name: /Button.tsx/ });
    expect(file).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('button', { name: 'Collapse src' }));
    expect(screen.queryByRole('link', { name: /Button.tsx/ })).not.toBeInTheDocument();
  });
  it('reveals a search selection when returning to the tree', async () => {
    await storage.write(json);
    const user = userEvent.setup();
    mount('/tree?q=button');
    await user.click(await screen.findByRole('link', { name: /Button.tsx/ }));
    await user.clear(screen.getByLabelText('Search files and folders'));
    expect(screen.getByRole('link', { name: /Button.tsx/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Collapse src' })).toBeInTheDocument();
  });
  it('batches search results and resets the batch size for a new query', async () => {
    await storage.write(
      JSON.stringify({
        name: 'root',
        type: 'folder',
        children: Array.from({ length: 205 }, (_, i) => ({
          name: `file-${i}.txt`,
          type: 'file',
          size: i,
        })),
      }),
    );
    const user = userEvent.setup();
    mount('/tree?q=file');
    const browser = await screen.findByRole('complementary', { name: 'Workspace browser' });
    expect(within(browser).getAllByRole('link')).toHaveLength(100);
    expect(screen.getByRole('status')).toHaveTextContent('205 results');
    await user.click(screen.getByRole('button', { name: 'Show more results (100 of 205)' }));
    expect(within(browser).getAllByRole('link')).toHaveLength(200);
    await user.click(screen.getByRole('button', { name: 'Show more results (200 of 205)' }));
    expect(within(browser).getAllByRole('link')).toHaveLength(205);
    expect(screen.queryByRole('button', { name: /Show more/ })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Search files and folders'), '-');
    expect(within(browser).getAllByRole('link')).toHaveLength(100);
  });
  it('shows a validation error without leaving import', async () => {
    const user = userEvent.setup();
    mount();
    await user.type(await screen.findByLabelText('JSON structure'), 'invalid');
    await user.click(screen.getByRole('button', { name: 'Open explorer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid JSON');
  });
  it('loads an uploaded JSON file', async () => {
    const user = userEvent.setup();
    mount();
    await user.upload(
      await screen.findByLabelText('Choose JSON file'),
      new File([json], 'tree.json', { type: 'application/json' }),
    );
    await waitFor(() => expect(screen.getByLabelText('JSON structure')).toHaveValue(json));
    await user.click(screen.getByRole('button', { name: 'Open explorer' }));
    expect(await screen.findByRole('heading', { name: 'File explorer' })).toBeInTheDocument();
  });
  it('restores saved data and search results after remount', async () => {
    await storage.write(json);
    const user = userEvent.setup();
    const first = mount('/tree');
    await user.type(await screen.findByLabelText('Search files and folders'), 'button');
    await user.click(screen.getByRole('link', { name: /Button.tsx/ }));
    expect(screen.getByRole('link', { name: /Button.tsx/ })).toHaveAttribute(
      'href',
      '/tree/root%2Fsrc%2FButton.tsx?q=button',
    );
    first.unmount();
    mount('/tree/root%2Fsrc%2FButton.tsx?q=button');
    expect(await screen.findByLabelText('Search files and folders')).toHaveValue('button');
    expect(screen.getByText('1 result')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Node details' })).getByText('root/src/Button.tsx'),
    ).toBeInTheDocument();
  });
  it('updates search and handles no matches', async () => {
    await storage.write(json);
    const user = userEvent.setup();
    mount('/tree');
    await user.type(await screen.findByLabelText('Search files and folders'), 'missing');
    expect(screen.getByText('No matching files or folders.')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Search files and folders'));
    expect(screen.getByRole('button', { name: 'Expand src' })).toBeInTheDocument();
  });
  it.each(['żółć #?.tsx', '100%.tsx', '%2F.tsx'])('routes special names: %s', async (name) => {
    const data = JSON.stringify({
      name: 'root',
      type: 'folder',
      children: [{ name, type: 'file', size: 12 }],
    });
    await storage.write(data);
    mount(nodeUrl(parseTree(data), 1) + '/');
    expect(
      await screen.findByRole('heading', {
        name,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(`root/${name}`)).toBeInTheDocument();
  });
  it('handles missing nodes and empty folders', async () => {
    await storage.write(json);
    const view = mount('/tree/root%2Fmissing');
    expect(await screen.findByText('Node not found')).toBeInTheDocument();
    view.unmount();
    const user = userEvent.setup();
    mount('/tree/root%2Fempty?q=empty');
    expect(await screen.findByText('This folder is empty.')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Parent folder' }));
    expect(screen.getByLabelText('Search files and folders')).toHaveValue('empty');
    const details = screen.getByRole('region', { name: 'Node details' });
    expect(within(details).getByRole('heading', { name: 'root' })).toBeInTheDocument();
    expect(within(details).queryByRole('link', { name: 'Parent folder' })).not.toBeInTheDocument();
  });
  it('handles an empty workspace and invalid saved data', async () => {
    await storage.write('broken');
    mount('/tree');
    expect(await screen.findByText('No tree imported yet')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('could not be restored');
  });
  it('does not replace saved data when persistence fails', async () => {
    await storage.write(json);
    vi.spyOn(storage, 'write').mockRejectedValue(new Error('Quota exceeded'));
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByLabelText('JSON structure'));
    await user.paste(json.replace('root', 'replacement'));
    await user.click(screen.getByRole('button', { name: 'Open explorer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save');
    expect(await storage.read()).toBe(json);
    await user.click(screen.getByRole('link', { name: 'Continue with saved tree' }));
    expect(
      within(screen.getByRole('region', { name: 'Node details' })).getByRole('heading', {
        name: 'root',
      }),
    ).toBeInTheDocument();
  });
});
