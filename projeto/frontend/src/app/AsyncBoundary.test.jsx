// Testes do AsyncBoundary — o trio carregando / erro / vazio padronizado.
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AsyncBoundary } from "./ui.jsx";

describe("AsyncBoundary", () => {
  it("carregando tem precedência: mostra o skeleton e não o conteúdo", () => {
    render(
      <AsyncBoundary loading error={new Error("x")} isEmpty skeleton={<div>skel</div>}>
        <div>conteúdo</div>
      </AsyncBoundary>,
    );
    expect(screen.getByText("skel")).toBeInTheDocument();
    expect(screen.queryByText("conteúdo")).not.toBeInTheDocument();
  });

  it("erro vem antes de vazio e de conteúdo, com botão de retry", () => {
    render(
      <AsyncBoundary loading={false} error={new Error("falhou")} isEmpty onRetry={() => {}}>
        <div>conteúdo</div>
      </AsyncBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("falhou");
    expect(screen.getByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
    expect(screen.queryByText("conteúdo")).not.toBeInTheDocument();
  });

  it("vazio mostra o slot empty quando não há loading nem erro", () => {
    render(
      <AsyncBoundary loading={false} error={null} isEmpty empty={<div>nada aqui</div>}>
        <div>conteúdo</div>
      </AsyncBoundary>,
    );
    expect(screen.getByText("nada aqui")).toBeInTheDocument();
    expect(screen.queryByText("conteúdo")).not.toBeInTheDocument();
  });

  it("renderiza o conteúdo quando não está carregando, sem erro e não vazio", () => {
    render(
      <AsyncBoundary loading={false} error={null} isEmpty={false}>
        <div>conteúdo</div>
      </AsyncBoundary>,
    );
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("usa defaults quando skeleton/empty não são passados", () => {
    const { rerender } = render(
      <AsyncBoundary loading>
        <div>conteúdo</div>
      </AsyncBoundary>,
    );
    // default de loading = TableSkeleton (renderiza uma tabela de esqueleto)
    expect(document.querySelector(".skeleton")).toBeInTheDocument();

    rerender(
      <AsyncBoundary loading={false} isEmpty>
        <div>conteúdo</div>
      </AsyncBoundary>,
    );
    // default de vazio = EmptyState com título genérico
    expect(screen.getByText(/nada por aqui/i)).toBeInTheDocument();
  });
});
