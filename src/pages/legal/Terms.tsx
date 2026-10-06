import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";
import Ph from "./Ph";

const Terms = () => (
  <LegalLayout path="/legal/terms">
    <p>
      These Terms &amp; Conditions (the "Terms") govern your use of the Kritex website at kritex.in (the "Site") and
      any purchase you make through it. The Site is operated by <Ph k="legalEntityName" />, trading as Kritex, with its
      registered office at <Ph k="registeredAddress" /> (GSTIN <Ph k="gstin" />) ("Kritex", "we", "us" or "our").
    </p>
    <p>
      Kritex has supplied apparel, footwear and field equipment to the armed forces of India and Bhutan since 1976.
      The online store extends part of that range to individual and business buyers in India. By creating an account,
      placing an order or otherwise using the Site, you agree to these Terms together with our{" "}
      <Link to="/legal/privacy">Privacy Policy</Link>, <Link to="/legal/shipping">Shipping Policy</Link>,{" "}
      <Link to="/legal/returns">Refund &amp; Returns Policy</Link> and{" "}
      <Link to="/legal/cancellation">Cancellation Policy</Link>, which form part of these Terms.
    </p>

    <h2>1. Eligibility and accounts</h2>
    <ul>
      <li>You must be at least 18 years old and capable of entering into a binding contract under the Indian Contract Act, 1872 to place an order.</li>
      <li>
        You are responsible for keeping your account credentials confidential and for all activity under your account.
        Tell us immediately at <a href="mailto:procurement@kritex.in">procurement@kritex.in</a> if you suspect
        unauthorised use.
      </li>
      <li>The information you give us (name, contact details, delivery address and, for business accounts, GSTIN and legal name) must be accurate and kept up to date.</li>
      <li>We may suspend or close an account that breaches these Terms, is used fraudulently, or provides false information.</li>
    </ul>

    <h2>2. Online sales are limited to India</h2>
    <p>
      Orders placed through the Site are accepted only for delivery to addresses in India. Defence, government and
      export requirements, including supply to Bhutan, are handled through our procurement team rather than the online
      store. Please contact <a href="mailto:procurement@kritex.in">procurement@kritex.in</a> for these.
    </p>

    <h2>3. Products and availability</h2>
    <ul>
      <li>
        <strong>Not every product can be bought online.</strong> Some items are shown for reference only and are
        marked "Enquire" or "Request a quote". These include items supplied only to the armed forces, police and
        government agencies, and items whose sale to the public is restricted or not yet confirmed. Kritex decides
        which products are offered for online sale and may change this at any time.
      </li>
      <li>
        <strong>Some products are sold only to approved business (B2B) accounts</strong>, for example bulk quantities,
        tiered pricing or items intended for institutional buyers. To apply for a business account, register and submit
        your business details. Approval is at our discretion.
      </li>
      <li>
        We try to describe and photograph products accurately. Colours, camouflage patterns and textures may look
        slightly different depending on your screen, and minor batch-to-batch variation in fabric shade is normal for
        technical textiles. Specifications are given in good faith and may be updated by the manufacturer.
      </li>
      <li>Product availability is shown at the time of browsing and is not guaranteed until your order is accepted (see section 5).</li>
      <li>
        You are responsible for complying with all laws that apply to you on the purchase, possession and use of
        uniforms, insignia and tactical equipment. Products must not be used to impersonate members of the armed
        forces, police or any government service. We may refuse or cancel an order if we reasonably believe it breaches
        this clause.
      </li>
    </ul>

    <h2>4. Prices and payment</h2>
    <ul>
      <li>
        All prices are in Indian Rupees (INR) and <strong>include applicable GST</strong>. The tax breakdown (CGST and
        SGST, or IGST, depending on the place of supply) is shown on your tax invoice.
      </li>
      <li>
        Shipping charges, if any, are shown separately at checkout before you pay. See the{" "}
        <Link to="/legal/shipping">Shipping Policy</Link>.
      </li>
      <li>
        Prices and promotions may change without notice. A change does not affect an order we have already accepted,
        except in the case of an obvious pricing error (see section 5).
      </li>
      <li>
        Payments are processed by our payment partner, Razorpay, using UPI, cards, net banking, wallets or other methods
        it offers. Kritex does not see or store your full card or bank details. Cash on delivery is not available.
      </li>
      <li>
        Approved business buyers may be offered bank transfer or purchase-order payment. Such orders are dispatched
        after payment is received, unless we agree otherwise in writing.
      </li>
      <li>Coupons and promotional codes are subject to their stated conditions, cannot be exchanged for cash and may be withdrawn at any time.</li>
    </ul>

    <h2>5. Orders and order acceptance</h2>
    <ul>
      <li>
        Placing an order is an offer to buy. The order confirmation email we send after payment confirms that we have
        received your order. It is not acceptance. A contract is formed only when we dispatch the goods and send you a
        dispatch confirmation.
      </li>
      <li>
        We may decline or cancel an order, in whole or in part, before dispatch. Reasons include: the item is out of
        stock or no longer offered for online sale; a pricing or description error; failed payment verification or
        suspected fraud; delivery to the pincode is not possible; quantities exceed reasonable personal use; or the
        order would breach section 3.
      </li>
      <li>
        If we cancel an order you have paid for, we will refund the full amount to your original payment method. See
        the <Link to="/legal/cancellation">Cancellation Policy</Link> for timelines.
      </li>
      <li>
        Quotes issued by our procurement team are valid for the period stated on the quote. Orders placed against a
        quote are also governed by its terms. Where the quote and these Terms differ, the quote prevails for that order.
      </li>
    </ul>

    <h2>6. Delivery, risk and title</h2>
    <p>
      Delivery is covered by our <Link to="/legal/shipping">Shipping Policy</Link>. Risk of loss passes to you on
      delivery to the address you gave. Title passes to you once we have received payment in full.
    </p>

    <h2>7. Returns, exchanges and refunds</h2>
    <p>
      Size exchanges and refunds for defective or incorrect items are covered by our{" "}
      <Link to="/legal/returns">Refund &amp; Returns Policy</Link>. Nothing in these Terms limits your rights under the
      Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020.
    </p>

    <h2>8. Invoices and GST</h2>
    <p>
      A GST tax invoice is issued for every order. Business buyers who enter a valid GSTIN and legal name at checkout
      will receive an invoice in that name so they can claim input tax credit. We cannot reissue an invoice in a
      different name or GSTIN after the order has been invoiced, except where the law allows it.
    </p>

    <h2>9. Acceptable use of the Site</h2>
    <p>You agree not to:</p>
    <ul>
      <li>use the Site for any unlawful purpose or in breach of these Terms;</li>
      <li>attempt to gain unauthorised access to the Site, other accounts or our systems, or interfere with their operation;</li>
      <li>scrape, copy or harvest product data, images or prices by automated means without our written permission;</li>
      <li>place orders for resale in breach of quantity limits, or misuse coupons or promotions.</li>
    </ul>

    <h2>10. Intellectual property</h2>
    <p>
      The Kritex name and logo, product photography, descriptions, and the design and content of the Site belong to
      Kritex or its licensors and are protected by law. You may not reproduce or use them commercially without our
      prior written consent. Third-party brand names mentioned on the Site belong to their respective owners.
    </p>

    <h2>11. Limitation of liability</h2>
    <p>
      To the extent permitted by law, Kritex is not liable for indirect, incidental or consequential loss arising from
      the use of the Site or the products, and our total liability for any order is limited to the amount you paid for
      that order. Nothing in these Terms excludes liability that cannot be excluded under Indian law, including
      liability for death or personal injury caused by negligence, or for fraud.
    </p>

    <h2>12. Force majeure</h2>
    <p>
      We are not responsible for delays or failures caused by events beyond our reasonable control. Examples include
      natural disasters, epidemics, strikes, government action, transport disruption, or outages at our payment or
      logistics partners. If such an event affects your order, we will tell you and, where appropriate, offer
      cancellation with a full refund.
    </p>

    <h2>13. Governing law and jurisdiction</h2>
    <p>
      These Terms are governed by the laws of India. Subject to your rights to approach a consumer commission under the
      Consumer Protection Act, 2019, the courts at <Ph k="jurisdictionCity" /> have exclusive jurisdiction over any
      dispute arising from these Terms or your use of the Site. Before you start formal proceedings, please contact our
      Grievance Officer (see <Link to="/legal/contact">Contact &amp; Grievance Officer</Link>) so we can try to resolve
      the matter.
    </p>

    <h2>14. Changes to these Terms</h2>
    <p>
      We may update these Terms from time to time. The "Last updated" date at the top shows when they were last
      changed. The version in force when you place an order applies to that order.
    </p>

    <h2>15. Contact</h2>
    <p>
      Questions about these Terms can be sent to <a href="mailto:procurement@kritex.in">procurement@kritex.in</a>. Full
      contact and grievance details are on our <Link to="/legal/contact">Contact &amp; Grievance Officer</Link> page.
    </p>
  </LegalLayout>
);

export default Terms;
