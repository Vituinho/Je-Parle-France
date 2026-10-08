// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";
import GlobalError from "@/app/global-error";

afterEach(cleanup);

describe("application error recovery", () => {
  it("offers a retry and a full navigation without exposing error details", () => {
    const retry = vi.fn();
    render(<ErrorPage error={new Error("private database credentials")} retry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível abrir esta página");
    expect(screen.queryByText(/private database credentials/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Voltar para hoje" })).toHaveAttribute("href", "/hoje");
  });

  it("renders the global fallback as a standalone Portuguese document without providers", () => {
    const markup = renderToStaticMarkup(
      <GlobalError error={new Error("private")} retry={() => {}} />,
    );
    expect(markup).toContain('<html lang="pt-BR"');
    expect(markup).toContain("<body");
    expect(markup).toContain('lang="fr"');
    expect(markup).toContain("Je Parle Français</title>");
    expect(markup).not.toContain("private");
  });
});
