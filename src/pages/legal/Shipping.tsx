import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";
import Ph from "./Ph";

const Shipping = () => (
  <LegalLayout path="/legal/shipping">
    <p>
      This policy explains how orders from the Kritex online store are shipped. Delivery timelines for bulk,
      institutional and export orders are agreed separately with our procurement team.
    </p>

    <h2>1. Where we ship</h2>
    <p>
      We currently ship online orders <strong>within India only</strong>. Checkout checks whether your pincode is
      serviceable. If it is not, we cannot accept the order for that address. For supply to Bhutan or other countries,
      please contact <a href="mailto:procurement@kritex.in">procurement@kritex.in</a>.
    </p>

    <h2>2. Shipping charges</h2>
    <ul>
      <li>A flat shipping fee of <Ph k="flatShippingFee" /> applies to each order.</li>
      <li><strong>Shipping is free on orders of <Ph k="freeShippingThreshold" /> or more</strong> (calculated on the order value after discounts, including GST).</li>
      <li>The shipping charge is shown at checkout before you pay. Product prices already include GST, and any GST on shipping is shown on your invoice.</li>
      <li>Freight for bulk or oversized consignments is quoted separately.</li>
    </ul>

    <h2>3. Dispatch and delivery times</h2>
    <ul>
      <li>In-stock orders are usually dispatched within <Ph k="dispatchTime" /> of payment confirmation. We do not dispatch on Sundays or public holidays.</li>
      <li>
        Delivery usually takes <Ph k="deliveryTime" /> after dispatch, depending on your location. Remote areas and the
        North-East, Jammu &amp; Kashmir, Ladakh, and Andaman &amp; Nicobar and Lakshadweep islands may take longer.
      </li>
      <li>Timelines are estimates. Weather, courier capacity, local restrictions or other events outside our control can delay delivery. We will keep you informed if your order is significantly delayed.</li>
      <li>If an order contains items from different stock locations, it may arrive in more than one package. You are not charged extra for this.</li>
    </ul>

    <h2>4. Courier partners and tracking</h2>
    <p>
      Orders are shipped through Shiprocket and its network of courier partners. When your order is dispatched, we
      email you the courier name and tracking number (AWB) with a link to track the shipment. You can also see the
      status in your account's order history.
    </p>

    <h2>5. Payment: prepaid orders only</h2>
    <p>
      All online orders must be paid in full at checkout through Razorpay. <strong>Cash on delivery (COD) is not
      available.</strong> Approved business accounts may be offered bank transfer or purchase-order payment. Those
      orders are dispatched after payment is received.
    </p>

    <h2>6. Receiving your order</h2>
    <ul>
      <li>Please make sure someone is available at the delivery address. Couriers usually make up to three delivery attempts.</li>
      <li>
        If the parcel looks tampered with or damaged, refuse it or note the damage with the courier, then email us
        within 48 hours of delivery. See the <Link to="/legal/returns">Refund &amp; Returns Policy</Link>.
      </li>
      <li>
        If delivery fails because the address was incorrect or incomplete, or the recipient was unavailable or refused
        an undamaged parcel, the order is returned to us. After we receive and inspect it, we will refund the order
        value minus the forward and return shipping charges, or reship it if you pay the shipping again.
      </li>
    </ul>

    <h2>7. Changing the delivery address</h2>
    <p>
      You can change the delivery address only before the order is dispatched. Email{" "}
      <a href="mailto:procurement@kritex.in">procurement@kritex.in</a> with your order number as soon as possible.
      The new address must also be in India and serviceable. A change of delivery state may change the GST breakdown
      on your invoice.
    </p>

    <h2>8. Questions</h2>
    <p>
      For anything related to delivery, write to <a href="mailto:procurement@kritex.in">procurement@kritex.in</a> with
      your order number, or see our <Link to="/legal/contact">Contact &amp; Grievance Officer</Link> page.
    </p>
  </LegalLayout>
);

export default Shipping;
