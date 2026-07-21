import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import Navbar from "./Navbar";
import Footer from "./Footer";

describe("public shell", () => {
  it("renders the shared public navigation labels", () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);

    expect(screen.getAllByText("Treatments").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Doctors").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Medicines").length).toBeGreaterThan(0);
  });

  it("renders footer links from the public navigation vocabulary", () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);

    expect(screen.getByRole("link", { name: "Doctors" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Medicines" })).toBeInTheDocument();
    expect(screen.getByText(/Authentic Ayurveda, modern access/i)).toBeInTheDocument();
  });
});
