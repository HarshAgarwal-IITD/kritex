import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";
import Ph from "./Ph";

const Privacy = () => (
  <LegalLayout path="/legal/privacy">
    <p>
      This Privacy Policy explains how <Ph k="legalEntityName" />, trading as Kritex ("Kritex", "we", "us"), processes
      your personal data when you use kritex.in, buy from our online store or send us a procurement enquiry. We act as
      the <strong>Data Fiduciary</strong> under the Digital Personal Data Protection Act, 2023 (the "DPDP Act") and
      follow the Information Technology Act, 2000 and the rules made under it.
    </p>

    <h2>1. Personal data we collect</h2>
    <dl>
      <dt>Account data</dt>
      <dd>Your name, email address, mobile number (if given) and password. The password is stored only as a secure hash. For business accounts, we also collect your organisation name, legal name and GSTIN.</dd>
      <dt>Order data</dt>
      <dd>The products, sizes and quantities you order, the prices paid, tax invoices, payment status and references, shipment and tracking details, and records of cancellations, exchanges and refunds.</dd>
      <dt>Address data</dt>
      <dd>The delivery and billing addresses you save or enter at checkout, including pincode and state. The state determines how GST is applied.</dd>
      <dt>Enquiry data</dt>
      <dd>What you tell us when you submit the contact or quote form or email us: your name, organisation or unit, email, and the details of your requirement.</dd>
      <dt>Technical data</dt>
      <dd>IP address, browser and device type, and the pages you request. Our servers log these for security, fraud prevention and troubleshooting.</dd>
    </dl>
    <p>
      <strong>Payment data:</strong> payments are processed by Razorpay. Card numbers, UPI PINs and net banking
      credentials are entered on Razorpay's secure checkout and are <strong>never received or stored by Kritex</strong>.
      We receive only a payment reference, the amount, the payment method type and the status.
    </p>

    <h2>2. Why we use your data</h2>
    <ul>
      <li><strong>To fulfil your orders:</strong> we take payment, issue GST invoices, pack and ship, provide tracking, and handle cancellations, exchanges and refunds.</li>
      <li><strong>To run your account:</strong> sign-in, saved addresses, order history and business-account verification.</li>
      <li><strong>To answer enquiries and quote requests</strong>, including bulk and institutional procurement.</li>
      <li><strong>To send service messages</strong> such as order confirmation, dispatch and tracking emails, password resets and policy updates.</li>
      <li><strong>To meet our legal obligations</strong> under GST, accounting, consumer protection and other applicable laws.</li>
      <li><strong>To keep the Site secure</strong>, prevent fraud and misuse, and fix errors.</li>
    </ul>
    <p>
      We process personal data on the basis of your consent, which you give when you create an account, place an order
      or submit an enquiry, and for the legitimate uses permitted by section 7 of the DPDP Act. These include
      processing data you provide voluntarily for a specified purpose and complying with law. We do not sell your
      personal data. We do not send marketing messages unless you have opted in, and you can opt out at any time.
    </p>

    <h2>3. Who we share it with</h2>
    <p>
      We share personal data only with Data Processors that help us run the store. Each processes it on our
      instructions and only for the purpose stated:
    </p>
    <ul>
      <li><strong>Razorpay</strong> processes payments and refunds.</li>
      <li><strong>Shiprocket and its courier partners</strong> receive your name, delivery address, phone number and the parcel details needed to deliver and track your order.</li>
      <li><strong><Ph k="emailProvider" /></strong> delivers transactional emails such as order, dispatch and account messages.</li>
      <li><strong><Ph k="hostingProvider" /></strong> hosts the Site, our servers, database and backups.</li>
    </ul>
    <p>
      We may also disclose personal data to government, tax or law-enforcement authorities where the law requires it,
      and to our professional advisers (for example, chartered accountants and legal counsel) under a duty of
      confidentiality. Some processors may store data outside India. Any such transfer is made only as permitted under
      the DPDP Act.
    </p>

    <h2>4. How long we keep it</h2>
    <ul>
      <li><strong>Account data:</strong> while your account is active. If you ask us to delete your account, we erase this data unless the law requires us to keep it.</li>
      <li><strong>Orders and invoices:</strong> for the period required by GST and accounting law (the CGST Act, 2017 and the Companies Act, 2013 or other applicable law), even after the account is closed.</li>
      <li><strong>Enquiries:</strong> for as long as needed to respond and follow up on the requirement, and then for a reasonable period for our records.</li>
      <li><strong>Server and security logs:</strong> for a limited period, after which they are deleted or anonymised. Longer retention applies only where needed to investigate an incident.</li>
    </ul>

    <h2>5. Your rights</h2>
    <p>Under the DPDP Act you, as a Data Principal, have the right to:</p>
    <ul>
      <li><strong>Access information</strong> about the personal data we process about you, the processing we carry out, and the Data Processors it has been shared with;</li>
      <li><strong>Correct, complete or update</strong> inaccurate or incomplete data. You can edit most account and address details yourself;</li>
      <li><strong>Erase</strong> your personal data, where it is no longer needed and we are not legally required to keep it;</li>
      <li><strong>Withdraw consent</strong> at any time. Processing carried out before withdrawal is not affected, and withdrawing may mean we can no longer provide some services, such as keeping your account;</li>
      <li><strong>Grievance redressal</strong> through our Grievance Officer (see below);</li>
      <li><strong>Nominate</strong> another person to exercise these rights on your behalf in the event of your death or incapacity.</li>
    </ul>
    <p>
      To exercise any of these rights, email our Grievance Officer at <Ph k="grievanceOfficerEmail" /> or{" "}
      <a href="mailto:procurement@kritex.in">procurement@kritex.in</a> from the email address on your account. We may
      need to verify your identity before acting on the request. If you are not satisfied with our response, you may
      complain to the Data Protection Board of India.
    </p>

    <h2>6. Security</h2>
    <p>
      We use reasonable security safeguards to protect personal data. These include encrypted connections (HTTPS),
      hashed passwords, access limited to authorised staff, secure session cookies, and regular backups. If a personal
      data breach occurs, we will notify the Data Protection Board of India and affected users as required by the DPDP
      Act.
    </p>

    <h2>7. Cookies and local storage</h2>
    <p>
      The Site uses only <strong>strictly necessary</strong> cookies and browser storage. These keep you signed in
      (a secure, httpOnly session cookie), remember your cart, and protect forms against abuse. We do not currently use
      advertising or third-party analytics cookies. If we add them, we will update this policy and ask for your consent
      first. Razorpay's checkout may set its own cookies to process your payment securely.
    </p>

    <h2>8. Children</h2>
    <p>
      The online store is intended for adults. We do not knowingly create accounts for, or accept orders from, anyone
      under 18. If you believe a child has given us personal data, contact us and we will delete it.
    </p>

    <h2>9. Grievance Officer</h2>
    <p>
      In accordance with the DPDP Act, the Information Technology Act, 2000 and the Consumer Protection (E-Commerce)
      Rules, 2020, our Grievance Officer is:
    </p>
    <dl>
      <dt>Name</dt>
      <dd><Ph k="grievanceOfficerName" />, <Ph k="grievanceOfficerDesignation" /></dd>
      <dt>Email</dt>
      <dd><Ph k="grievanceOfficerEmail" /></dd>
      <dt>Phone</dt>
      <dd><Ph k="grievanceOfficerPhone" /></dd>
      <dt>Address</dt>
      <dd><Ph k="registeredAddress" /></dd>
    </dl>
    <p>
      See <Link to="/legal/contact">Contact &amp; Grievance Officer</Link> for response timelines.
    </p>

    <h2>10. Changes to this policy</h2>
    <p>
      We may update this Privacy Policy as our services or the law change. The "Last updated" date shows the current
      version. If we make a significant change to how we use your personal data, we will notify you by email or on the
      Site.
    </p>
  </LegalLayout>
);

export default Privacy;
