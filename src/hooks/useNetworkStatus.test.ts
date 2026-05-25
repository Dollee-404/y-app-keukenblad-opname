import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNetworkStatus } from "./useNetworkStatus";

describe("useNetworkStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returnt true als navigator.onLine true is bij mount", () => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(true);
  });

  it("returnt false als navigator.onLine false is bij mount", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(false);
  });

  it("wordt true na 'online' event", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });

  it("wordt false na 'offline' event (na 1s debounce)", () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    // Nog niet veranderd — debounce loopt
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(false);
  });

  it("annuleert offline-debounce als 'online' snel terugkomt", () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
      window.dispatchEvent(new Event("online"));
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Debounce geannuleerd — blijft true
    expect(result.current).toBe(true);
  });

  it("verwijdert event-listeners bij unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useNetworkStatus());

    expect(addSpy.mock.calls.some(([e]) => e === "online")).toBe(true);
    expect(addSpy.mock.calls.some(([e]) => e === "offline")).toBe(true);

    unmount();

    expect(removeSpy.mock.calls.some(([e]) => e === "online")).toBe(true);
    expect(removeSpy.mock.calls.some(([e]) => e === "offline")).toBe(true);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
