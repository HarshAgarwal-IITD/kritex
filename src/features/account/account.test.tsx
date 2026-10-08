import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { getAdminMockDb, MOCK_PASSWORD } from "@/mocks/admin-handlers";
import { getCommerceMockDb, MOCK_OTP, MOCK_RESET_TOKEN, seedMockCart } from "@/mocks/commerce-handlers";
import { renderApp, resetMocks, SHIRT_M } from "@/test/render-app";
import { safeNext } from "./auth-messages";

beforeEach(() => resetMocks());

const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const location = () => screen.getByTestId("location");

describe("safeNext", () => {
  it("only allows same-site paths and avoids auth-page loops", () => {
    expect(safeNext("/checkout")).toBe("/checkout");
    expect(safeNext("//evil.com")).toBe("/account");
    expect(safeNext("https://evil.com")).toBe("/account");
    expect(safeNext("/login?next=/x")).toBe("/account");
    expect(safeNext(null)).toBe("/account");
  });
});

describe("account guard", () => {
  it("redirects guests to /login?next=", async () => {
    renderApp("/account/orders");
    await waitFor(() => expect(location()).toHaveTextContent("/login?next=%2Faccount%2Forders"));
    expect(await screen.findByRole("heading", { name: "Log In" })).toBeInTheDocument();
  });
});

describe("login", () => {
  it("signs in with a password, returns to next and refetches the (merged) cart", async () => {
    const { queryClient } = renderApp("/login?next=%2Fcart");
    await screen.findByRole("heading", { name: "Log In" });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    type("Email", "customer@example.com");
    type("Password", "wrong");
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));
    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();

    type("Password", MOCK_PASSWORD);
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));
    await waitFor(() => expect(location()).toHaveTextContent(/^\/cart$/));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["cart"] });
  });

  it("signs in with an email code", async () => {
    renderApp("/login");
    await screen.findByRole("heading", { name: "Log In" });
    fireEvent.click(screen.getByRole("tab", { name: "Email code" }));
    type("Email", "customer@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Email Me a Code" }));
    await screen.findByLabelText("Code");
    type("Code", "000000");
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));
    expect(await screen.findByText(/That code isn't right/)).toBeInTheDocument();
    type("Code", MOCK_OTP);
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));
    await waitFor(() => expect(location()).toHaveTextContent(/^\/account$/));
    expect(await screen.findByLabelText("Full name")).toHaveValue("Chris Customer");
  });
});

describe("signup", () => {
  it("creates the account, shows 'check your email', and unverified sign-in explains why", async () => {
    renderApp("/signup");
    await screen.findByRole("heading", { name: "Create Account" });
    type("Full name", "New Person");
    type("Email", "new@example.com");
    type("Password", "short");
    type("Confirm password", "different");
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
    expect(await screen.findByText("Use at least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();

    type("Password", "longenough1");
    type("Confirm password", "longenough1");
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
    expect(await screen.findByTestId("check-email")).toHaveTextContent("new@example.com");
    expect(getAdminMockDb().users.find((u) => u.email === "new@example.com")?.emailVerified).toBe(false);

    fireEvent.click(screen.getByRole("link", { name: /Go to log in/ }));
    await screen.findByRole("heading", { name: "Log In" });
    type("Email", "new@example.com");
    type("Password", "longenough1");
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));
    expect(await screen.findByText(/Please verify your email first/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resend verification email" }));
    expect(await screen.findByText("Verification email sent.")).toBeInTheDocument();
  });

  it("reports an existing account", async () => {
    renderApp("/signup");
    await screen.findByRole("heading", { name: "Create Account" });
    type("Full name", "Chris");
    type("Email", "customer@example.com");
    type("Password", "longenough1");
    type("Confirm password", "longenough1");
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
    expect(await screen.findByText(/already exists/)).toBeInTheDocument();
  });
});

describe("password reset", () => {
  it("forgot password shows a generic confirmation", async () => {
    renderApp("/forgot-password");
    await screen.findByRole("heading", { name: "Reset Password" });
    type("Email", "customer@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Send Reset Link" }));
    expect(await screen.findByText(/a reset link is on its way/)).toBeInTheDocument();
  });

  it("rejects a missing/invalid link and sets a new password with a valid token", async () => {
    renderApp("/reset-password?error=INVALID_TOKEN");
    expect(await screen.findByText(/invalid or has expired/)).toBeInTheDocument();
  });

  it("sets a new password with the token from the link", async () => {
    renderApp(`/reset-password?token=${MOCK_RESET_TOKEN}`);
    await screen.findByRole("heading", { name: "Set a New Password" });
    type("New password", "newpassword1");
    type("Confirm password", "newpassword1");
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
    expect(await screen.findByRole("heading", { name: "Password Updated" })).toBeInTheDocument();
  });
});

describe("account pages (signed in)", () => {
  beforeEach(() => resetMocks("customer@example.com"));

  it("updates the profile", async () => {
    renderApp("/account");
    const name = await screen.findByLabelText("Full name");
    fireEvent.change(name, { target: { value: "Chris C" } });
    type("Mobile number", "98765 11111");
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByText("Profile saved.")).toBeInTheDocument();
    expect(getAdminMockDb().users.find((u) => u.id === "usr_customer")).toMatchObject({ name: "Chris C", phone: "+919876511111" });
  });

  it("lists orders, shows detail with timeline, cancels a paid order", async () => {
    renderApp("/account/orders");
    const list = await screen.findByRole("list", { name: "Orders" });
    expect(within(list).getAllByRole("link")).toHaveLength(2);
    fireEvent.click(within(list).getByText("KTX-100002"));

    expect(await screen.findByRole("heading", { name: "Order KTX-100002" })).toBeInTheDocument();
    expect(within(await screen.findByRole("list", { name: "Order timeline" })).getByText("Payment received")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel Order" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Reason (optional)"), { target: { value: "Ordered by mistake" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel Order" }));
    await waitFor(() => expect(screen.getByTestId("order-status")).toHaveTextContent("Cancelled"));
    expect(screen.getByText("Cancelled by you: Ordered by mistake")).toBeInTheDocument();
  });

  it("requests an exchange on a delivered order and offers the invoice", async () => {
    renderApp("/account/orders/KTX-100001");
    await screen.findByRole("list", { name: "Order timeline" });
    expect(screen.getByRole("button", { name: /Invoice KTX\/2026-27\/00001/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Track shipment/ })).toHaveAttribute("href", expect.stringContaining("delhivery"));
    fireEvent.click(screen.getByRole("button", { name: "Return / Exchange" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Send Request" }));
    await waitFor(() => expect(screen.getByTestId("order-status")).toHaveTextContent("Return requested"));
  });

  it("adds an address with PIN autofill", async () => {
    renderApp("/account/addresses");
    await screen.findAllByTestId("saved-address");
    fireEvent.click(screen.getByRole("button", { name: /Add Address/ }));
    await screen.findByRole("dialog");
    type("Full name", "Office");
    type("Mobile number", "9123456780");
    type("Address", "4 MG Road");
    type("PIN code", "560001");
    await waitFor(() => expect(screen.getByLabelText("State")).toHaveValue("29"));
    expect(screen.getByLabelText("City")).toHaveValue("Bengaluru");
    fireEvent.click(screen.getByRole("button", { name: "Save Address" }));
    await waitFor(() => expect(screen.getAllByTestId("saved-address")).toHaveLength(2));
    expect(getCommerceMockDb().addresses.get("usr_customer")![1]).toMatchObject({ state: "Karnataka", phone: "+919123456780" });
  });

  it("applies for a business account (GSTIN validated client-side) and shows the status", async () => {
    renderApp("/account/business");
    await screen.findByRole("heading", { name: "Business Account" });
    type("Registered business name", "Acme Traders");
    type("GSTIN", "27AAPFU0939F1Z");
    fireEvent.click(screen.getByRole("button", { name: "Submit Application" }));
    expect(await screen.findByText(/Enter a valid 15-character GSTIN/)).toBeInTheDocument();
    type("GSTIN", "27aapfu0939f1zv");
    fireEvent.click(screen.getByRole("button", { name: "Submit Application" }));
    expect(await screen.findByTestId("business-status")).toHaveTextContent(/Under review/);
    expect(screen.getByTestId("business-status")).toHaveTextContent("27AAPFU0939F1ZV");
    expect(screen.queryByRole("button", { name: "Submit Application" })).toBeNull();
  });

  it("log out returns home and refetches the cart", async () => {
    seedMockCart([{ variantId: SHIRT_M, quantity: 1 }]);
    renderApp("/account");
    await screen.findByLabelText("Full name");
    fireEvent.click(screen.getByRole("button", { name: /Log out/ }));
    await waitFor(() => expect(location()).toHaveTextContent(/^\/$/));
  });
});
