import { jest } from '@jest/globals';
import { showToast } from 'src/lib/notifications/toast-notification/toast-notification.js';

describe('ToastNotification', () => {
  beforeEach(() => {
    // Clear DOM before each test
    document.body.innerHTML = '';
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('element is registered and can be created', () => {
    const el = document.createElement('toast-notification');
    expect(el).toBeInstanceOf(HTMLElement);
    // Ensure shadow root is attached
    expect(el.shadowRoot).not.toBeNull();
  });

  test('show() updates content, type and visibility', () => {
    const el = document.createElement('toast-notification');
    document.body.appendChild(el);

    el.show('Success Message', 'success');

    const shadow = el.shadowRoot;
    const toast = shadow.querySelector('.toast');
    const message = shadow.querySelector('.toast-message');
    const icon = shadow.querySelector('.alert__icon');

    expect(message.textContent).toBe('Success Message');
    expect(toast.classList.contains('show')).toBe(true);
    expect(toast.classList.contains('alert--ok')).toBe(true);
    // Check for success icon (✓)
    expect(icon.textContent).toBe('✓');
  });

  test('show() defaults to info type', () => {
    const el = document.createElement('toast-notification');
    document.body.appendChild(el);

    el.show('Info Message');

    const shadow = el.shadowRoot;
    const toast = shadow.querySelector('.toast');
    const icon = shadow.querySelector('.alert__icon');

    expect(toast.classList.contains('alert--info')).toBe(true);
    // Check for info icon (ℹ️)
    expect(icon.textContent).toBe('ℹ️');
  });

  test('hide() removes visibility', () => {
    const el = document.createElement('toast-notification');
    document.body.appendChild(el);

    el.show('Test');
    expect(el.shadowRoot.querySelector('.toast').classList.contains('show')).toBe(true);

    el.hide();
    expect(el.shadowRoot.querySelector('.toast').classList.contains('show')).toBe(false);
  });

  test('auto-dismisses after duration', () => {
    const el = document.createElement('toast-notification');
    document.body.appendChild(el);
    const duration = 2000;

    el.show('Auto Dismiss', 'info', duration);

    expect(el.shadowRoot.querySelector('.toast').classList.contains('show')).toBe(true);

    // Fast-forward time
    jest.advanceTimersByTime(duration);

    expect(el.shadowRoot.querySelector('.toast').classList.contains('show')).toBe(false);
  });

  test('does not auto-dismiss if duration is 0', () => {
    const el = document.createElement('toast-notification');
    document.body.appendChild(el);

    el.show('Sticky Message', 'error', 0);

    expect(el.shadowRoot.querySelector('.toast').classList.contains('show')).toBe(true);

    // Fast-forward time significantly
    jest.advanceTimersByTime(10000);

    expect(el.shadowRoot.querySelector('.toast').classList.contains('show')).toBe(true);
  });

  test('clears previous timeout on new show call', () => {
    const el = document.createElement('toast-notification');
    document.body.appendChild(el);

    // First show with short duration
    el.show('First', 'info', 1000);

    // Second show immediately after
    el.show('Second', 'info', 5000);

    // Fast forward past first duration
    jest.advanceTimersByTime(1000);

    // Should still be showing (because second call cleared the first timeout)
    expect(el.shadowRoot.querySelector('.toast').classList.contains('show')).toBe(true);
    expect(el.shadowRoot.querySelector('.toast-message').textContent).toBe('Second');

    // Fast forward to end of second duration
    jest.advanceTimersByTime(4000);
    expect(el.shadowRoot.querySelector('.toast').classList.contains('show')).toBe(false);
  });

  test('showToast helper creates element if missing', () => {
    expect(document.querySelector('toast-notification')).toBeNull();

    showToast('Helper Test');

    const el = document.querySelector('toast-notification');
    expect(el).not.toBeNull();
    expect(el.shadowRoot.querySelector('.toast-message').textContent).toBe('Helper Test');
  });

  test('showToast helper uses existing element', () => {
    const el = document.createElement('toast-notification');
    el.id = 'existing-toast';
    document.body.appendChild(el);

    showToast('Reuse Test');

    const toasts = document.querySelectorAll('toast-notification');
    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe('existing-toast');
    expect(toasts[0].shadowRoot.querySelector('.toast-message').textContent).toBe('Reuse Test');
  });
});
