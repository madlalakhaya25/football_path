import { render, screen } from "@testing-library/react";
import { RatingRing } from "@/components/ui/rating-ring";

describe("RatingRing", () => {
  it("renders the numeric value as text", () => {
    render(<RatingRing value={78} size={84} />);
    expect(screen.getByText("78")).toBeInTheDocument();
  });

  it("has role=meter for accessibility", () => {
    render(<RatingRing value={65} size={84} />);
    expect(screen.getByRole("meter")).toBeInTheDocument();
  });

  it("sets aria-valuenow correctly", () => {
    render(<RatingRing value={90} size={84} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "90");
  });

  it("shows 0 when value is 0", () => {
    render(<RatingRing value={0} size={84} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders an SVG element", () => {
    const { container } = render(<RatingRing value={75} size={84} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies the correct size to the SVG", () => {
    const { container } = render(<RatingRing value={50} size={100} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "100");
    expect(svg).toHaveAttribute("height", "100");
  });
});
