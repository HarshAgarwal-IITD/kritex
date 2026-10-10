import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { apiPath, getMockQueries } from "@/mocks/handlers";
import { newQueryClient } from "@/features/catalog/test-utils";
import { loadPendingEnquiry, clearPendingEnquiry } from "@/features/enquiry/pending";
import { resetMocks } from "@/test/render-app";
import ContactSection from "./ContactSection";

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

const LocationProbe = () => {
  const loc = useLocation();
  return <div data-testid="location">{`${loc.pathname}${loc.search}`}</div>;
};

const renderSection = () =>
  render(
    <QueryClientProvider client={newQueryClient()}>
      <MemoryRouter>
        <ContactSection />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );

/** The mock inbox is seeded (admin tests); find the one this test sent. */
const sentQuery = () => getMockQueries().find((q) => q.requirements === "500 combat shirts");

function fillForm({ organization = "" }: { organization?: string } = {}) {
  fireEvent.change(screen.getByPlaceholderText("Full Name"), { target: { value: "Asha Rao" } });
  fireEvent.change(screen.getByPlaceholderText("Ministry / Unit"), { target: { value: organization } });
  fireEvent.change(screen.getByPlaceholderText(/Describe your procurement requirements/), {
    target: { value: "500 combat shirts" },
  });
}

/** Signed in: wait until the account has loaded (the name is prefilled). */
const waitForAccount = () => waitFor(() => expect(screen.getByPlaceholderText("Full Name")).toHaveValue("Chris Customer"));

describe("ContactSection", () => {
  beforeEach(() => {
    toastMock.success.mockReset();
    toastMock.error.mockReset();
    clearPendingEnquiry();
    resetMocks("customer@example.com");
  });

  it("lets guests fill the form; Submit saves it and goes to log in (sent after sign-in)", async () => {
    resetMocks(null);
    renderSection();
    const button = await screen.findByRole("button", { name: "Log In & Submit" });
    fillForm({ organization: "Army HQ" });
    fireEvent.click(button);

    expect(screen.getByTestId("location")).toHaveTextContent("/login?next=%2F%23contact");
    expect(loadPendingEnquiry()).toMatchObject({
      kind: "contact",
      body: { name: "Asha Rao", organization: "Army HQ", requirements: "500 combat shirts" },
    });
    expect(sentQuery()).toBeUndefined();
  });

  it("submits the inquiry to the API with the account email, shows a success toast and resets the form", async () => {
    renderSection();
    await waitForAccount();
    expect(screen.getByText("customer@example.com")).toBeInTheDocument();
    fillForm({ organization: "Army HQ" });

    const button = screen.getByRole("button", { name: "Submit Inquiry" });
    fireEvent.click(button);

    // fireEvent is wrapped in act(), so the in-flight state is rendered synchronously.
    expect(screen.getByRole("button", { name: "Submitting..." })).toBeDisabled();
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledTimes(1));
    expect(toastMock.error).not.toHaveBeenCalled();

    expect(sentQuery()).toMatchObject({
      name: "Asha Rao",
      organization: "Army HQ",
      email: "customer@example.com",
      requirements: "500 combat shirts",
      status: "NEW",
    });

    expect(screen.getByPlaceholderText("Full Name")).toHaveValue("Chris Customer");
    expect(screen.getByPlaceholderText(/Describe your procurement requirements/)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Submit Inquiry" })).toBeEnabled();
  });

  it("omits an empty organization from the request body", async () => {
    renderSection();
    await waitForAccount();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit Inquiry" }));

    await waitFor(() => expect(toastMock.success).toHaveBeenCalled());
    expect(sentQuery()?.organization).toBeNull();
  });

  it.each([400, 500])("shows an error toast and keeps the input when the API returns %i", async (status) => {
    server.use(
      http.post(apiPath("/api/v1/queries"), () =>
        HttpResponse.json({ error: { code: "ERR", message: "nope" } }, { status }),
      ),
    );
    renderSection();
    await waitForAccount();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit Inquiry" }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledTimes(1));
    expect(toastMock.error.mock.calls[0][0]).toContain("procurement@kritex.in");
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("Full Name")).toHaveValue("Asha Rao");
    expect(screen.getByRole("button", { name: "Submit Inquiry" })).toBeEnabled();
  });
});
