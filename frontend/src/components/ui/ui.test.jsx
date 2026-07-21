import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

describe("shared UI primitives", () => {
  it("renders a primary button with a loading state", () => {
    render(<Button loading>Book a consultation</Button>);

    const button = screen.getByRole("button", { name: /book a consultation/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveTextContent("Book a consultation");
  });

  it("connects labels and inputs through the shared primitives", () => {
    render(
      <div>
        <Label htmlFor="search">Search JeevanHub</Label>
        <Input id="search" placeholder="Find a doctor" />
      </div>,
    );

    expect(screen.getByLabelText("Search JeevanHub")).toHaveAttribute(
      "placeholder",
      "Find a doctor",
    );
  });

  it("returns a selected date through the date picker boundary", () => {
    const onChange = vi.fn();
    render(<DatePicker value="2026-07-21" onChange={onChange} />);

    const input = screen.getByLabelText("Select a date");
    fireEvent.change(input, { target: { value: "2026-07-22" } });

    expect(onChange).toHaveBeenCalledWith("2026-07-22");
  });

  it("renders a badge with its variant classes", () => {
    render(<Badge variant="success">Confirmed</Badge>);

    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  it("renders empty-state title, description, and action", () => {
    render(
      <EmptyState
        title="No appointments yet"
        description="Book a consultation to see it here."
        action={<Button>Find a doctor</Button>}
      />,
    );

    expect(screen.getByText("No appointments yet")).toBeInTheDocument();
    expect(screen.getByText("Book a consultation to see it here.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find a doctor/i })).toBeInTheDocument();
  });

  it("opens a dialog from its trigger and closes it", async () => {
    render(
      <Dialog>
        <DialogTrigger render={<Button>Open</Button>} />
        <DialogContent>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>Pick a new time with your doctor.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByText("Reschedule appointment")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open/i }));

    expect(await screen.findByText("Reschedule appointment")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByText("Reschedule appointment")).not.toBeInTheDocument();
  });
});
