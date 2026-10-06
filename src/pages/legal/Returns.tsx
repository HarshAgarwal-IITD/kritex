import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";
import Ph from "./Ph";

const Returns = () => (
  <LegalLayout path="/legal/returns">
    <p>
      Kritex gear is built for service conditions, and we want it to fit and perform as it should. This policy covers
      orders placed through the Kritex online store for delivery in India. Bulk, institutional and quote-based orders
      follow the return terms in the relevant quote or purchase order.
    </p>

    <h2>1. At a glance</h2>
    <ul>
      <li><strong>Size exchange within 7 days</strong> of delivery for unused items with original tags and packaging.</li>
      <li><strong>No cash refunds for change of mind or wrong size ordered.</strong> We offer an exchange instead.</li>
      <li><strong>Defective, damaged or wrong item?</strong> Report it within 48 hours of delivery for a replacement or full refund.</li>
      <li><strong>Approved refunds</strong> go to your original payment method within 5–7 business days after we inspect the returned item.</li>
    </ul>

    <h2>2. Size exchanges</h2>
    <p>
      If an item does not fit, you can exchange it for a different size of the same product within{" "}
      <strong>7 days of delivery</strong>, provided that:
    </p>
    <ul>
      <li>the item is unused, unwashed and unaltered, with no marks, odours or signs of wear (boots must not have been worn outdoors);</li>
      <li>all original tags, labels and packaging (including the boot box) are intact and returned with it;</li>
      <li>the item is not in the non-returnable list in section 4.</li>
    </ul>
    <p>
      Each order line can be exchanged once. If the size you want is out of stock, we can offer a different colour or
      variant of the same product at the same price, or hold the exchange until the size is restocked. Size exchanges
      are not converted into cash refunds. Return shipping for size exchanges is paid by{" "}
      <Ph k="exchangeShippingPayer" />. We ship the replacement to you free of charge.
    </p>
    <p>
      Please check the size chart and specifications on each product page before ordering. Our team can advise on
      sizing at <a href="mailto:procurement@kritex.in">procurement@kritex.in</a>.
    </p>

    <h2>3. Defective, damaged or incorrect items</h2>
    <p>
      If your item arrives defective or damaged in transit, or is not what you ordered (wrong product, size or colour),
      email us <strong>within 48 hours of delivery</strong> with your order number, photos of the item and its
      packaging, and if possible an unboxing video. If the outer package looks tampered with or damaged at delivery,
      please note this with the courier or refuse the parcel.
    </p>
    <p>
      Once we confirm the issue, we will arrange a reverse pickup at no cost to you. After inspection, we will send a
      replacement or, if you prefer or a replacement is unavailable, give you a <strong>full refund</strong> of the item
      price and any shipping charge you paid for it.
    </p>
    <p>
      Manufacturing defects that appear later under normal use (for example, sole separation or seam failure) will be
      assessed case by case. Normal wear and tear, misuse, or damage from improper care, alteration or modification are
      not covered.
    </p>

    <h2>4. Non-returnable items</h2>
    <p>Unless they are defective or incorrect, the following cannot be exchanged or returned:</p>
    <ul>
      <li>items customised to your order, such as name tapes, embroidery, printed insignia or tailored alterations;</li>
      <li>made-to-order or specially procured items;</li>
      <li>socks, innerwear and other items that cannot be resold for hygiene reasons, once the seal or packaging is opened;</li>
      <li>items marked "final sale" or "non-returnable" on the product page;</li>
      <li>bulk and B2B orders, which are covered by the terms of the quote or purchase order.</li>
    </ul>

    <h2>5. How to request an exchange or return</h2>
    <ol>
      <li>
        Email <a href="mailto:procurement@kritex.in">procurement@kritex.in</a> with the subject "Return / Exchange –
        [your order number]". Tell us which item, the reason and, for exchanges, the size you need. Add photos for
        defective or incorrect items.
      </li>
      <li>We will confirm eligibility within 2 business days and either arrange a pickup or give you the returns address (<Ph k="returnsAddress" />).</li>
      <li>Pack the item securely in its original packaging with tags attached, and include a note with your order number.</li>
      <li>We inspect returned items within 3 business days of receiving them and email you the outcome.</li>
    </ol>
    <p>
      Items that fail inspection (used, damaged by the customer, or missing tags) will be sent back to you, and no
      exchange or refund will be made.
    </p>

    <h2>6. Refunds</h2>
    <ul>
      <li>
        Approved refunds are made to your <strong>original payment method</strong> through Razorpay within{" "}
        <strong>5–7 business days after inspection</strong>. Your bank or card issuer may take a few more days to
        credit the amount.
      </li>
      <li>We do not issue refunds in cash or to a different account or payment method.</li>
      <li>Refunds for cancelled orders are covered by the <Link to="/legal/cancellation">Cancellation Policy</Link>.</li>
      <li>Where a refund is made, a GST credit note is issued against the original invoice.</li>
    </ul>

    <h2>7. Need help?</h2>
    <p>
      Contact us at <a href="mailto:procurement@kritex.in">procurement@kritex.in</a>. If you are unhappy with how a
      return was handled, you can escalate to our Grievance Officer. Details are on the{" "}
      <Link to="/legal/contact">Contact &amp; Grievance Officer</Link> page. This policy does not affect your statutory
      rights under the Consumer Protection Act, 2019.
    </p>
  </LegalLayout>
);

export default Returns;
