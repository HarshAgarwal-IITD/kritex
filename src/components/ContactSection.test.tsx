import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { apiPath, getMockQueries } from "@/mocks/handlers";
import ContactSection from "./ContactSection";

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

function fillForm({ organization = "" }: { organization?: string } = {}) {
  fireEvent.change(screen.getByPlaceholderText("Full Name"), { target: { value: "Asha Rao" } });
  fireEvent.change(screen.getByPlaceholderText("Ministry / Unit"), { target: { value: organization } });
  fireEvent.change(screen.getByPlaceholderText("official@gov.in"), { target: { value: "asha@gov.in" } });
  fireEvent.change(screen.getByPlaceholderText(/Describe your procurement requirements/), {
    target: { value: "500 combat shirts" },
  });
}

describe("ContactSection", () => {
  beforeEach(() => {
    toastMock.success.mockReset();
    toastMock.error.mockReset();
  });

  it("submits the inquiry to the API, shows a success toast and resets the form", async () => {
    render(<ContactSection />);
    fillForm({ organization: "Army HQ" });

    const button = screen.getByRole("button", { name: "Submit Inquiry" });
    fireEvent.click(button);

    // fireEvent is wrapped in act(), so the in-flight state is rendered synchronously.
    expect(screen.getByRole("button", { name: "Submitting..." })).toBeDisabled();
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledTimes(1));
    expect(toastMock.error).not.toHaveBeenCalled();

    const [saved] = getMockQueries();
    expect(saved).toMatchObject({
      name: "Asha Rao",
      organization: "Army HQ",
      email: "asha@gov.in",
      requirements: "500 combat shirts",
      status: "NEW",
    });

    expect(screen.getByPlaceholderText("Full Name")).toHaveValue("");
    expect(screen.getByPlaceholderText("official@gov.in")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Submit Inquiry" })).toBeEnabled();
  });

  it("omits an empty organization from the request body", async () => {
    render(<ContactSection />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit Inquiry" }));

    await waitFor(() => expect(toastMock.success).toHaveBeenCalled());
    expect(getMockQueries()[0].organization).toBeNull();
  });

  it.each([400, 500])("shows an error toast and keeps the input when the API returns %i", async (status) => {
    server.use(
      http.post(apiPath("/api/v1/queries"), () =>
        HttpResponse.json({ error: { code: "ERR", message: "nope" } }, { status }),
      ),
    );
    render(<ContactSection />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit Inquiry" }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledTimes(1));
    expect(toastMock.error.mock.calls[0][0]).toContain("procurement@kritex.in");
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("Full Name")).toHaveValue("Asha Rao");
    expect(screen.getByRole("button", { name: "Submit Inquiry" })).toBeEnabled();
  });
});
