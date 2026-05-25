import { render, screen } from "@testing-library/react";
import { Logo } from "@/components/logo";

describe("Logo", () => {
  it("renders the brand name", () => {
    render(<Logo />);
    expect(screen.getByText(/GrowFit/i)).toBeInTheDocument();
  });

  it("renders the football emoji", () => {
    render(<Logo />);
    expect(screen.getByText("⚽")).toBeInTheDocument();
  });

  it("accepts a custom className", () => {
    const { container } = render(<Logo className="my-logo" />);
    expect(container.firstChild).toHaveClass("my-logo");
  });
});
