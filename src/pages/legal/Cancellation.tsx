import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";

const Cancellation = () => (
  <LegalLayout path="/legal/cancellation">
    <p>
      This policy covers cancellation of orders placed through the Kritex online store. Bulk, institutional and
      quote-based orders follow the cancellation terms in the relevant quote or purchase order.
    </p>

    <h2>1. Cancelling before dispatch: full refund</h2>
    <p>
      You can cancel all or part of an order at any time <strong>before it is dispatched</strong>, at no charge. To do
      so, either:
    </p>
    <ul>
      <li>use the cancel option on the order in your account's order history, where available; or</li>
      <li>
        email <a href="mailto:procurement@kritex.in">procurement@kritex.in</a> with the subject "Cancel order – [your
        order number]".
      </li>
    </ul>
    <p>
      We will confirm the cancellation by email. The <strong>full amount paid</strong> for the cancelled items,
      including any shipping charge, is refunded to your original payment method through Razorpay. We start the
      refund within 2 business days of confirming the cancellation, and it normally reaches your account within
      5–7 business days, depending on your bank.
    </p>
    <p>
      Orders are packed quickly. If your request arrives while the order is already being handed to the courier, we may
      not be able to stop it. In that case section 2 applies.
    </p>

    <h2>2. After dispatch</h2>
    <p>
      An order cannot be cancelled once it has been dispatched. After delivery, our{" "}
      <Link to="/legal/returns">Refund &amp; Returns Policy</Link> applies. That includes the 7-day size exchange and
      the process for defective or incorrect items.
    </p>
    <p>
      If you refuse delivery of an undamaged parcel, it will be returned to us and handled as described in section 6
      of our <Link to="/legal/shipping">Shipping Policy</Link>.
    </p>

    <h2>3. Cancellation by Kritex</h2>
    <p>
      We may cancel an order, in whole or in part, before dispatch. Reasons include: the item is out of stock or no
      longer offered for online sale; there is a pricing or listing error; payment cannot be verified or we suspect
      fraud; the delivery pincode cannot be served; or the order breaches our{" "}
      <Link to="/legal/terms">Terms &amp; Conditions</Link>. We will tell you by email and refund the full amount paid
      for the cancelled items to your original payment method on the same timeline as above.
    </p>

    <h2>4. Failed or duplicate payments</h2>
    <p>
      If money is debited but the order is not confirmed, or you are charged twice for the same order, Razorpay normally
      reverses the payment automatically within 5–7 business days. If it does not, email us with the payment reference
      and we will help resolve it.
    </p>

    <h2>5. Contact</h2>
    <p>
      For help with a cancellation, write to <a href="mailto:procurement@kritex.in">procurement@kritex.in</a>. To
      escalate an unresolved issue, see our <Link to="/legal/contact">Contact &amp; Grievance Officer</Link> page.
    </p>
  </LegalLayout>
);

export default Cancellation;
