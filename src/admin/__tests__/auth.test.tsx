import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { MOCK_PASSWORD, resetAdminMockDb, setMockSession } from "@/mocks/admin-handlers";
import { renderAdmin, stubPointerApis } from "./render";

beforeEach(() => {
  resetAdminMockDb();
  stubPointerApis();
});

async function signIn(email: string, password = MOCK_PASSWORD) {
  fireEvent.change(await screen.findByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("admin auth guard", () => {
  it("sends signed-out visitors to the login page, then back to where they were going", async () => {
    renderAdmin("/admin/categories");

    await screen.findByRole("button", { name: "Sign in" });
    expect(screen.getByTestId("location")).toHaveTextContent("/admin/login?next=%2Fadmin%2Fcategories");

    await signIn("staff@kritex.in");

    expect(await screen.findByRole("heading", { name: "Categories" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/admin\/categories$/);
    expect(screen.getByText(/staff@kritex.in · STAFF/)).toBeInTheDocument();
  });

  it("shows an error for wrong credentials", async () => {
    renderAdmin("/admin");
    await signIn("admin@kritex.in", "wrong-password");
    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
  });

  it("validates the form before calling the server", async () => {
    renderAdmin("/admin/login");
    fireEvent.click(await screen.findByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
  });

  it("refuses customers at login", async () => {
    renderAdmin("/admin/login");
    await signIn("customer@example.com");
    expect(await screen.findByText("This account doesn't have admin access.")).toBeInTheDocument();
  });

  it("redirects signed-in non-staff users to the storefront", async () => {
    setMockSession("customer@example.com");
    renderAdmin("/admin/products");
    expect(await screen.findByRole("heading", { name: "Storefront home" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });

  it("lets staff straight in and signs out", async () => {
    setMockSession("admin@kritex.in");
    renderAdmin("/admin");
    expect(await screen.findByRole("heading", { name: "Products" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/admin\/login/));
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
