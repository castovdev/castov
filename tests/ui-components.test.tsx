// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "@/components/ui/copy-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { JsonLd } from "@/components/json-ld";
import { RelatedTools } from "@/components/related-tools";

function mockClipboard(impl: () => Promise<void>) {
  const writeText = vi.fn(impl);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  return writeText;
}

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
});

describe("CopyButton", () => {
  it("copies the value and confirms it", async () => {
    const writeText = mockClipboard(() => Promise.resolve());
    render(<CopyButton value="1790000000" label="Unix seconds" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy Unix seconds" }));
    });
    expect(writeText).toHaveBeenCalledWith("1790000000");
    expect(screen.getByRole("button")).toHaveTextContent("Copied");
    expect(screen.getByRole("status")).toHaveTextContent("Unix seconds copied to clipboard");
  });

  it("returns to 'Copy' after a moment", async () => {
    vi.useFakeTimers();
    mockClipboard(() => Promise.resolve());
    render(<CopyButton value="x" label="value" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(screen.getByRole("button")).toHaveTextContent("Copied");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button")).toHaveTextContent("Copy");
    expect(screen.getByRole("button")).not.toHaveTextContent("Copied");
  });

  it("falls back to execCommand when the Clipboard API is unavailable", async () => {
    const exec = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", { value: exec, configurable: true });
    render(<CopyButton value="fallback" label="value" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(exec).toHaveBeenCalledWith("copy");
    expect(screen.getByRole("button")).toHaveTextContent("Copied");
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("reports failure instead of throwing", async () => {
    mockClipboard(() => Promise.reject(new Error("denied")));
    Object.defineProperty(document, "execCommand", { value: vi.fn(() => false), configurable: true });
    render(<CopyButton value="x" label="value" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(screen.getByRole("button")).toHaveTextContent("Copy failed");
    expect(screen.getByRole("status")).toHaveTextContent("Could not copy value");
  });

  it("can be disabled", () => {
    render(<CopyButton value="" label="value" disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("ThemeToggle", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    document.documentElement.dataset.theme = "dark";
    localStorage.clear();
  });

  it("switches between themes and remembers the choice", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /theme/i });
    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("castov-theme")).toBe("dark");
    fireEvent.click(button);
    expect(localStorage.getItem("castov-theme")).toBe("system");
    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("castov-theme")).toBe("light");
  });

  it("still switches when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /theme/i }));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});

describe("MobileNav", () => {
  it("opens, lists the main links and closes with Escape", () => {
    render(<MobileNav />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
    const nav = screen.getByRole("navigation", { name: "Mobile" });
    expect(within(nav).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/tools", "/guides", "/about", "/contact"]);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("navigation", { name: "Mobile" })).toBeNull();
  });
});

describe("JsonLd", () => {
  it("escapes '<' so content cannot close the script tag", () => {
    const { container } = render(<JsonLd data={{ name: "</script><b>x" }} />);
    const html = container.querySelector("script")!.innerHTML;
    expect(html).not.toContain("</script>");
    expect(JSON.parse(html).name).toBe("</script><b>x");
  });
});

describe("RelatedTools", () => {
  it("renders links to the requested tools", () => {
    render(<RelatedTools slugs={["epoch-converter", "timezone-converter"]} />);
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/epoch-converter", "/timezone-converter"]);
    expect(screen.getByRole("heading", { name: "Related tools" })).toBeInTheDocument();
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<RelatedTools slugs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("AdSlot", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("renders nothing (no fake ads) until AdSense is configured", async () => {
    vi.resetModules();
    const { AdSlot } = await import("@/components/ad-slot");
    const { container } = render(<AdSlot placement="tool-top" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a labelled, non-interactive slot once configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890123456");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_MIDDLE", "987654321");
    vi.resetModules();
    const { AdSlot } = await import("@/components/ad-slot");
    const { container } = render(<AdSlot placement="content-middle" />);
    const aside = screen.getByLabelText("Advertisement");
    expect(aside).toHaveTextContent("Advertisement");
    expect(container.querySelector("ins.adsbygoogle")).toHaveAttribute("data-ad-slot", "987654321");
    expect(container.querySelector("button, a")).toBeNull();
    // A placement without its own slot id stays empty.
    const other = render(<AdSlot placement="tool-top" />);
    expect(other.container).toBeEmptyDOMElement();
  });
});
