import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { STORAGE_KEY } from './model';

beforeEach(() => { localStorage.clear(); window.history.replaceState(null, '', '/#term-butter'); });
const route = (hash: string) => act(() => { window.history.replaceState(null, '', '/' + hash); window.dispatchEvent(new HashChangeEvent('hashchange')); });

describe('dictionary', () => {
  it('opens a direct term link and searches aliases with no-result recovery', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'butter.' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'jail' } });
    expect(screen.getByRole('heading', { name: 'hostage dribble.' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzzzz' } });
    expect(screen.getByText('That one’s not in the playbook. Yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Explore all terms/ }));
    expect(screen.getByRole('heading', { name: 'butter.' })).toBeInTheDocument();
  });
  it('filters categories and persists saved entries across remounts', () => {
    const view = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Save butter' }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).saved).toEqual(['butter']);
    fireEvent.click(screen.getByRole('button', { name: /My saved/ }));
    expect(screen.getByLabelText('Basketball terms').querySelectorAll('.term-button')).toHaveLength(1);
    view.unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Unsave butter' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Off-ball', exact: true }));
    expect(screen.getByLabelText('Basketball terms').querySelectorAll('.term-button')).toHaveLength(2);
  });
  it('opens a timestamped embed and supplies an external fallback', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Play Wizards TV broadcast at 25:50' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('iframe')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/o7EjgIyGeSY?start=1550&autoplay=1');
    expect(within(dialog).getByRole('link', { name: /Watch on YouTube at 25:50/ })).toHaveAttribute('href', 'https://youtu.be/o7EjgIyGeSY?t=1550');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close dialog' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('follows browser hash navigation', () => {
    render(<App />);
    route('#term-court-mapping');
    expect(screen.getByRole('heading', { name: 'court mapping.' })).toBeInTheDocument();
    route('#term-unknown');
    expect(screen.getByRole('heading', { name: 'butter.' })).toBeInTheDocument();
  });
});
describe('sample review queue', () => {
  it('requires a source and persists approval on the correct entry', () => {
    route('#review');
    const view = render(<App />);
    const cards = document.querySelectorAll('.draft-card');
    expect(within(cards[0] as HTMLElement).getByRole('button', { name: /Approve/ })).toBeDisabled();
    fireEvent.click(within(cards[2] as HTMLElement).getByRole('button', { name: /Approve/ }));
    expect(document.querySelectorAll('.draft-card')).toHaveLength(2);
    route('#term-ghost-screen');
    expect(screen.getByText('2 SOURCE CLIPS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Mind the Game at 29:59' })).toBeInTheDocument();
    view.unmount();
    render(<App />);
    expect(screen.getByText('2 SOURCE CLIPS')).toBeInTheDocument();
  });
  it('rejects drafts and restores the queue without removing bookmarks', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ saved: ['butter'], approved: [], rejected: [] }));
    route('#review');
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Reject' })[0]);
    expect(document.querySelectorAll('.draft-card')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Reset sample queue' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset sample queue' }));
    expect(document.querySelectorAll('.draft-card')).toHaveLength(3);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).saved).toEqual(['butter']);
  });
});
