import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Winger</Badge>);
    expect(screen.getByText("Winger")).toBeInTheDocument();
  });

  it("applies the neutral variant by default", () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default")).toHaveClass("bg-secondary");
  });

  it("applies the brand variant", () => {
    render(<Badge variant="brand">Brand</Badge>);
    expect(screen.getByText("Brand")).toHaveClass("bg-brand/15");
  });

  it("applies the neutral variant explicitly", () => {
    render(<Badge variant="neutral">Neutral</Badge>);
    expect(screen.getByText("Neutral")).toHaveClass("bg-secondary");
  });

  it("applies the success variant", () => {
    render(<Badge variant="success">Played</Badge>);
    expect(screen.getByText("Played")).toHaveClass("bg-success/15");
  });

  it("applies the danger variant", () => {
    render(<Badge variant="danger">Cancelled</Badge>);
    // Uses opacity modifier — check for text-destructive which is always present
    expect(screen.getByText("Cancelled")).toHaveClass("text-destructive");
  });

  it("applies the warning variant", () => {
    render(<Badge variant="warning">Postponed</Badge>);
    expect(screen.getByText("Postponed")).toHaveClass("text-warning");
  });

  it("applies the outline variant", () => {
    render(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText("Outline")).toHaveClass("bg-transparent");
  });

  it("accepts a custom className", () => {
    render(<Badge className="test-class">Test</Badge>);
    expect(screen.getByText("Test")).toHaveClass("test-class");
  });
});
