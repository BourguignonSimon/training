import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Layout } from '../Layout';

const renderLayout = () => {
  const onNavigate = vi.fn();
  render(
    <Layout
      currentView="dashboard"
      onNavigate={onNavigate}
      notice={{ title: 'Reminder', message: 'Hydrate regularly.' }}
    >
      <div>Content</div>
    </Layout>
  );
  return { onNavigate };
};

describe('Layout', () => {
  it('renders navigation and notice content', () => {
    renderLayout();

    expect(screen.getByText('UltraCoach')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Training Plan')).toBeInTheDocument();
    expect(screen.getByText('Reminder')).toBeInTheDocument();
    expect(screen.getByText('Hydrate regularly.')).toBeInTheDocument();
  });
});
