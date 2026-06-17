import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useFetch } from "./useFetch.js";

describe("useFetch", () => {
  it("começa carregando e entrega os dados", async () => {
    const fn = vi.fn().mockResolvedValue({ valor: 1 });
    const { result } = renderHook(() => useFetch(fn, []));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ valor: 1 });
    expect(result.current.error).toBeNull();
  });

  it("captura erro da função", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("falhou"));
    const { result } = renderHook(() => useFetch(fn, []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeNull();
  });

  it("reload() refaz a busca", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const { result } = renderHook(() => useFetch(fn, []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fn).toHaveBeenCalledTimes(1);
    await act(async () => { await result.current.reload(); });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("refaz quando as deps mudam", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    let dep = 1;
    const { result, rerender } = renderHook(() => useFetch(() => fn(dep), [dep]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fn).toHaveBeenCalledTimes(1);
    dep = 2;
    rerender();
    await waitFor(() => expect(fn).toHaveBeenCalledTimes(2));
    expect(fn).toHaveBeenLastCalledWith(2);
  });
});
