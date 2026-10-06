import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";
import Ph from "./Ph";

const Contact = () => (
  <LegalLayout path="/legal/contact">
    <p>
      Kritex has supplied defence-grade apparel and field equipment to the armed forces of India and Bhutan since
      1976. Whether you are tracking an online order or planning an institutional procurement, these are the ways to
      reach us.
    </p>

    <h2>1. Business details</h2>
    <dl>
      <dt>Legal name</dt>
      <dd><Ph k="legalEntityName" /> (trading as Kritex)</dd>
      <dt>Registered address</dt>
      <dd><Ph k="registeredAddress" /></dd>
      <dt>GSTIN</dt>
      <dd><Ph k="gstin" /></dd>
      <dt>CIN / registration</dt>
      <dd><Ph k="cin" /></dd>
    </dl>

    <h2>2. Orders, support and procurement</h2>
    <dl>
      <dt>Email</dt>
      <dd><a href="mailto:procurement@kritex.in">procurement@kritex.in</a></dd>
      <dt>Phone</dt>
      <dd>
        <a href="tel:+917477459459">+91 74774 59459</a>
        <br />
        <a href="tel:+919434809707">+91 94348 09707</a>
      </dd>
      <dt>Hours</dt>
      <dd><Ph k="businessHours" /></dd>
    </dl>
    <p>
      For order queries, please include your order number. For bulk orders, technical datasheets or quotations, you
      can also use the enquiry form on our <Link to="/#contact">home page</Link>.
    </p>

    <h2>3. Grievance Officer</h2>
    <p>
      Under the Consumer Protection (E-Commerce) Rules, 2020, the Information Technology Act, 2000 and the Digital
      Personal Data Protection Act, 2023, Kritex has appointed a Grievance Officer. Contact them about complaints on
      orders, products, refunds or the Site, and about requests regarding your personal data.
    </p>
    <dl>
      <dt>Name</dt>
      <dd><Ph k="grievanceOfficerName" /></dd>
      <dt>Designation</dt>
      <dd><Ph k="grievanceOfficerDesignation" /></dd>
      <dt>Email</dt>
      <dd><Ph k="grievanceOfficerEmail" /></dd>
      <dt>Phone</dt>
      <dd><Ph k="grievanceOfficerPhone" /></dd>
      <dt>Address</dt>
      <dd><Ph k="registeredAddress" /></dd>
    </dl>

    <h3>How we handle complaints</h3>
    <ul>
      <li>Include your name, contact details, order number (if any) and a clear description of the issue, with any supporting photos or documents.</li>
      <li>We acknowledge every complaint <strong>within 48 hours</strong> and give you a reference number.</li>
      <li>We aim to resolve complaints <strong>within one month</strong> of receiving them, and will keep you updated if more time is needed.</li>
      <li>
        If you are not satisfied with the outcome, you may approach the National Consumer Helpline (1915 or
        consumerhelpline.gov.in) or the appropriate consumer commission. For personal data matters, you may approach the
        Data Protection Board of India.
      </li>
    </ul>

    <h2>4. Related policies</h2>
    <ul>
      <li><Link to="/legal/terms">Terms &amp; Conditions</Link></li>
      <li><Link to="/legal/privacy">Privacy Policy</Link></li>
      <li><Link to="/legal/returns">Refund &amp; Returns Policy</Link></li>
      <li><Link to="/legal/shipping">Shipping Policy</Link></li>
      <li><Link to="/legal/cancellation">Cancellation Policy</Link></li>
    </ul>
  </LegalLayout>
);

export default Contact;
