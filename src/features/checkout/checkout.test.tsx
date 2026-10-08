import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { apiPath } from "@/mocks/handlers";
import { getCommerceMockDb, seedMockCart } from "@/mocks/commerce-handlers";
import { renderApp, resetMocks, SHIRT_L, SHIRT_M } from "@/test/render-app";
import { lookupPincode, normalizePhone } from "./india";

beforeEach(() => resetMocks());

const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

async function fillContact(email = "guest@example.com", phone = "98765 43210") {
  await screen.findByLabelText("Email");
  type("Email", email);
  type("Mobile number", phone);
  fireEvent.click(screen.getByRole("button", { name: "Continue to Address" }));
  await screen.findByLabelText("PIN code");
}

async function fillAddress(pincode: string) {
  type("Full name", "Guest Buyer");
  type("Mobile number", "+91 98765 43210");
  type("Address", "1 Test Street");
  type("PIN code", pincode);
  fireEvent.click(screen.getByRole("button", { name: "Deliver Here" }));
}

const payButton = () => screen.findByRole("button", { name: /^Pay ₹/ });

describe("india helpers", () => {
  it("looks up state (and city for common PINs) and normalises phones", () => {
    expect(lookupPincode("400001")).toEqual({ stateCode: "27", state: "Maharashtra", city: "Mumbai" });
    expect(lookupPincode("560034")).toMatchObject({ stateCode: "29", state: "Karnataka" });
    expect(lookupPincode("403001")).toMatchObject({ stateCode: "30" });
    expect(lookupPincode("012345")).toBeNull();
    expect(normalizePhone("098765 43210")).toBe("+919876543210");
    expect(normalizePhone("+91-98765-43210")).toBe("+919876543210");
    expect(normalizePhone("12345")).toBeNull();
  });
});

describe("guest checkout (fake gateway)", () => {
  it("cart with 2 variants + coupon → contact → address → review (CGST/SGST) → simulate success → success page", async () => {
    seedMockCart([
      { variantId: SHIRT_M, quantity: 1 },
      { variantId: SHIRT_L, quantity: 1 },
    ]);
    renderApp("/cart");
    await screen.findAllByTestId("cart-line");
    type("Coupon code", "WELCOME10");
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await screen.findByTestId("applied-coupon");
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));

    await fillContact();
    // Invalid PIN → validation message; valid PIN autofills state + city.
    type("PIN code", "12");
    fireEvent.click(screen.getByRole("button", { name: "Deliver Here" }));
    expect(await screen.findByText("Enter a valid 6-digit PIN code")).toBeInTheDocument();
    await fillAddress("400001");
    await waitFor(() => expect(screen.queryByLabelText("PIN code")).toBeNull());

    const summary = screen.getByRole("complementary", { name: "Order summary" });
    await waitFor(() => expect(within(summary).getByTestId("gst-note")).toHaveTextContent(/CGST .* \+ SGST/));
    expect(within(summary).getByTestId("totals-discount")).toHaveTextContent("259.80");
    expect(within(summary).getByTestId("totals-total")).toHaveTextContent("2,338.20");
    expect(within(summary).getAllByText("GST 12%")).toHaveLength(2);

    fireEvent.click(await payButton());
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/fake gateway/i)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Success" }));

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/checkout\/success\/KTX-100003$/));
    expect(await screen.findByRole("heading", { name: "Thank you for your order" })).toBeInTheDocument();
    expect(screen.getByTestId("order-number")).toHaveTextContent("KTX-100003");

    const db = getCommerceMockDb();
    expect(db.orders[0]).toMatchObject({ number: "KTX-100003", status: "PAID", email: "guest@example.com", couponCode: "WELCOME10" });
    expect(db.orders[0].shippingAddress).toMatchObject({ stateCode: "27", state: "Maharashtra", city: "Mumbai", phone: "+919876543210" });
    // One Idempotency-Key (a UUID) for the attempt.
    expect([...db.idempotency.keys()]).toEqual([expect.stringMatching(/^[0-9a-f-]{36}$/)]);
    expect(db.cartLines).toEqual([]);
  });

  it("shows IGST for an inter-state address and sends a GSTIN when added", async () => {
    seedMockCart([{ variantId: SHIRT_M, quantity: 1 }]);
    renderApp("/checkout");
    await fillContact();
    await fillAddress("560001");
    const summary = await screen.findByRole("complementary", { name: "Order summary" });
    await waitFor(() => expect(within(summary).getByTestId("gst-note")).toHaveTextContent(/IGST/));

    fireEvent.click(screen.getByRole("switch", { name: "I need a GST invoice" }));
    type("GSTIN", "27AAPFU0939F1ZV");
    type("Registered business name", "Acme Traders");
    fireEvent.click(screen.getByRole("button", { name: "Add GSTIN" }));
    // GSTIN from Maharashtra, billing (= shipping) in Karnataka → client-side mismatch.
    expect(await screen.findByText(/registered in Maharashtra/)).toBeInTheDocument();

    type("GSTIN", "29AAPFU0939F1ZV");
    fireEvent.click(screen.getByRole("button", { name: "Add GSTIN" }));
    expect(await screen.findByTestId("applied-gstin")).toHaveTextContent("29AAPFU0939F1ZV");

    fireEvent.click(await payButton());
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Success" }));
    await screen.findByRole("heading", { name: "Thank you for your order" });
    expect(getCommerceMockDb().orders[0]).toMatchObject({ gstin: "29AAPFU0939F1ZV", businessName: "Acme Traders" });
  });

  it("simulated failure → failure page → retry the same order → success", async () => {
    seedMockCart([{ variantId: SHIRT_M, quantity: 1 }]);
    renderApp("/checkout");
    await fillContact();
    await fillAddress("400001");
    fireEvent.click(await payButton());
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Fail" }));

    expect(await screen.findByRole("heading", { name: "Payment failed" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/checkout/failure/KTX-100003");
    expect(getCommerceMockDb().orders[0]).toMatchObject({ status: "PENDING_PAYMENT", paymentStatus: "FAILED" });

    fireEvent.click(screen.getByRole("button", { name: /Try Payment Again/ }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Success" }));
    expect(await screen.findByRole("heading", { name: "Thank you for your order" })).toBeInTheDocument();
    expect(getCommerceMockDb().orders[0].status).toBe("PAID");
  });

  it("explains PRICE_CHANGED and keeps the customer on review", async () => {
    seedMockCart([{ variantId: SHIRT_M, quantity: 1 }]);
    server.use(
      http.post(apiPath("/api/v1/checkout"), () =>
        HttpResponse.json({ error: { code: "PRICE_CHANGED", message: "changed" } }, { status: 409 }),
      ),
    );
    renderApp("/checkout");
    await fillContact();
    await fillAddress("400001");
    fireEvent.click(await payButton());
    expect(await screen.findByText(/Prices changed since you reviewed your order/)).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/checkout");
  });

  it("blocks checkout with an empty cart", async () => {
    renderApp("/checkout");
    expect(await screen.findByText("Your cart is empty.")).toBeInTheDocument();
  });
});

describe("signed-in checkout", () => {
  it("uses the saved default address and skips the email field", async () => {
    resetMocks("customer@example.com");
    seedMockCart([{ variantId: SHIRT_M, quantity: 1 }]);
    renderApp("/checkout");
    expect(await screen.findByText("customer@example.com")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).toBeNull();
    type("Mobile number", "9876543210");
    fireEvent.click(screen.getByRole("button", { name: "Continue to Address" }));
    expect(await screen.findByText("12 Marine Drive")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Deliver Here" }));
    fireEvent.click(await payButton());
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Success" }));
    await screen.findByRole("heading", { name: "Thank you for your order" });
    expect(screen.getByRole("link", { name: "View Order" })).toHaveAttribute("href", "/account/orders/KTX-100003");
    expect(getCommerceMockDb().orders[0]).toMatchObject({ email: "customer@example.com", userId: "usr_customer" });
  });
});
