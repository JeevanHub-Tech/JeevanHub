import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import AuthProvider from "../../context/AuthContext";
import HomeScreen from "./index.jsx";

describe("public homepage", () => {
  it("leads with practitioner-guided consultation", () => {
    render(<MemoryRouter><AuthProvider><HomeScreen /></AuthProvider></MemoryRouter>);

    expect(screen.getByRole("heading", { name: /calmer way to find your path/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /book a consultation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /explore treatments/i })).toBeInTheDocument();
  });
});
