import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Lura Energy collects, uses, and protects personal information.',
};

const EFFECTIVE = '12 October 2026';
const UPDATED = '12 October 2026';

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <p className="eyebrow">Legal</p>
        <h1>Privacy Policy</h1>
        <p className="legal-meta">Effective date: {EFFECTIVE} · Last updated: {UPDATED}</p>

        <p className="legal-lead">
          Lura Energy is committed to protecting the privacy, confidentiality, and security of
          individuals who interact with our company. This policy explains what we collect, why,
          how we use it, and the rights you have over your personal information.
        </p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Lura Energy is committed to protecting the privacy, confidentiality, and security of
            individuals who interact with our company through our website, digital platforms,
            customer service channels, and other business operations.
          </p>
          <p>
            This Privacy Policy explains how Lura Energy collects, uses, stores, processes,
            protects, and, where necessary, shares personal information obtained from visitors to
            our website, prospective customers, existing customers, distributors, installers,
            business partners, suppliers, and other individuals who communicate with us.
          </p>
          <p>
            As a company operating in the renewable energy and solar power industry, we understand
            that trust is an essential part of every customer relationship. Whether you are
            enquiring about an inverter, purchasing a lithium battery, requesting information
            about a solar power system, seeking technical assistance, or exploring a business
            partnership, we aim to handle your personal information responsibly and transparently.
          </p>
          <p>
            This policy also explains your privacy rights, the choices available to you regarding
            your personal information, and how you can contact us with questions or concerns.
          </p>
          <p>
            By using our website or voluntarily providing personal information to Lura Energy, you
            acknowledge that you have had the opportunity to review this Privacy Policy. Where
            consent is required by applicable law, we will obtain it before carrying out the
            relevant processing.
          </p>
        </section>

        <section>
          <h2>2. About Lura Energy</h2>
          <p>
            Lura Energy operates in the solar energy and power solutions sector, providing access
            to energy products and related services through its business operations and
            distribution network.
          </p>
          <p>
            Our activities may include the supply and promotion of solar batteries, inverters,
            solar panels, integrated power systems, portable power solutions, and other related
            products. We may also support product enquiries, installation-related communications,
            technical assistance, after-sales services, warranty enquiries, and distributor
            relationships.
          </p>
          <p>
            In carrying out these activities, we may process personal information to respond to
            requests, communicate with customers, coordinate services, maintain business records,
            and improve the quality of our customer experience.
          </p>
          <p>
            For the purposes of this policy, references to "Lura Energy", "Lura", "we", "our", or
            "us" mean the Lura Energy business responsible for the relevant website or service.
          </p>
        </section>

        <section>
          <h2>3. Scope of This Privacy Policy</h2>
          <p>
            This Privacy Policy applies to personal information collected or processed through:
          </p>
          <ul>
            <li>The official Lura Energy website and its contact forms.</li>
            <li>Product enquiry and quotation request forms.</li>
            <li>Customer service and technical support communications.</li>
            <li>Installation enquiries and service coordination.</li>
            <li>Warranty, maintenance, repair, and after-sales support requests.</li>
            <li>Distributor, installer, supplier, and business partnership enquiries.</li>
            <li>Marketing campaigns and promotional activities.</li>
            <li>Emails, telephone calls, and other communication channels operated by Lura Energy.</li>
            <li>Other digital or offline interactions in which this policy is made available.</li>
          </ul>
          <p>
            This policy applies to website visitors, prospective customers, existing customers,
            business representatives, and other individuals whose personal information we process
            in connection with these activities.
          </p>
          <p>
            Certain services may have additional privacy notices or specific terms that apply
            alongside this policy. Where applicable, those notices should be read together with
            this document.
          </p>
        </section>

        <section>
          <h2>4. Personal Information We Collect</h2>
          <p>
            The personal information we collect depends on how you interact with Lura Energy and
            the nature of your request.
          </p>

          <h3>4.1 Information You Provide Directly</h3>
          <p>
            When you contact us, request a quotation, enquire about a product, or submit a form,
            we may collect:
          </p>
          <ul>
            <li>Full name.</li>
            <li>Email address.</li>
            <li>Telephone number or WhatsApp contact number.</li>
            <li>Company or business name.</li>
            <li>Business role or professional designation.</li>
            <li>City, state, delivery location, or service location.</li>
            <li>Information about the products or services you are interested in.</li>
            <li>Details of your enquiry, complaint, or support request.</li>
            <li>Information you voluntarily include in messages, attachments, or other communications.</li>
          </ul>
          <p>
            You should only provide information that is relevant to your enquiry or the service
            you are requesting.
          </p>

          <h3>4.2 Product and Solar Energy Enquiry Information</h3>
          <p>
            To help us understand your energy requirements, we may process information you choose
            to provide concerning:
          </p>
          <ul>
            <li>The type of solar or power solution you require.</li>
            <li>Your preferred inverter, battery, panel, or power station.</li>
            <li>Estimated power consumption or load requirements.</li>
            <li>Installation or delivery requirements.</li>
            <li>Your intended application, such as residential, commercial, industrial, or distribution use.</li>
            <li>Your preferred method of contact.</li>
            <li>Your budget range, where voluntarily provided.</li>
          </ul>
          <p>
            Some technical information about a property, energy installation, or electricity
            usage may relate to an identifiable person. Where it constitutes personal
            information, we will handle it in accordance with this policy and applicable law.
          </p>
          <p>
            We do not require you to disclose unnecessary personal details simply to make a
            general product enquiry.
          </p>

          <h3>4.3 Customer, Installation, and After-Sales Information</h3>
          <p>
            Where relevant to a purchase, installation, maintenance request, repair, or warranty
            enquiry, we may collect information such as:
          </p>
          <ul>
            <li>Customer and order reference details.</li>
            <li>Product model, serial number, or warranty reference.</li>
            <li>Purchase or service history.</li>
            <li>Installation address and appointment details.</li>
            <li>Description of a product fault or technical issue.</li>
            <li>Photographs, videos, or documents voluntarily supplied to explain an issue.</li>
            <li>Service visit records and communications concerning the resolution of a complaint.</li>
          </ul>
          <p>
            This information helps us identify the relevant product, coordinate appropriate
            support, maintain service records, and manage warranty or after-sales requests.
          </p>
          <p>
            We will seek to limit collection to information reasonably necessary for the relevant
            business purpose.
          </p>

          <h3>4.4 Distributor and Business Partner Information</h3>
          <p>
            Individuals contacting us on behalf of a distributor, installer, supplier, retailer,
            or other business may provide:
          </p>
          <ul>
            <li>Name and business contact information.</li>
            <li>Business name and location.</li>
            <li>Professional role.</li>
            <li>Partnership or distribution enquiry details.</li>
            <li>Relevant correspondence and commercial information.</li>
          </ul>
          <p>
            We use this information to evaluate enquiries, maintain business relationships,
            coordinate communications, and support legitimate commercial activities.
          </p>

          <h3>4.5 Information Collected Automatically</h3>
          <p>
            When you visit our website, certain technical information may be collected
            automatically, depending on the website configuration and technologies in use.
          </p>
          <p>This may include:</p>
          <ul>
            <li>Internet Protocol (IP) address.</li>
            <li>Browser type and version.</li>
            <li>Device type and operating system.</li>
            <li>Pages visited and approximate time spent on pages.</li>
            <li>Referring website or source.</li>
            <li>Date and time of website access.</li>
            <li>Technical diagnostic and security logs.</li>
          </ul>
          <p>
            Such information may help us maintain website functionality, diagnose technical
            problems, understand general website usage, and protect our digital services against
            misuse.
          </p>
          <p>
            We will only collect and use these categories of information to the extent supported
            by our actual website configuration and applicable law.
          </p>

          <h3>4.6 Information Received from Other Sources</h3>
          <p>
            Where lawful and relevant to a business relationship, we may receive limited
            information from distributors, installation partners, service providers, or
            individuals who submit an enquiry on your behalf.
          </p>
          <p>
            For example, a business partner may provide your contact details to coordinate an
            installation or service appointment.
          </p>
          <p>
            Where required, we will take appropriate steps to ensure that the information is
            handled lawfully and that individuals receive any necessary privacy information.
          </p>
        </section>

        <section>
          <h2>5. How We Use Your Personal Information</h2>
          <p>
            Lura Energy uses personal information for specific, legitimate, and relevant business
            purposes. These purposes may include the following.
          </p>

          <h3>5.1 Responding to Enquiries</h3>
          <p>
            We use the contact information and message you submit to respond to your questions,
            provide requested information, clarify your energy requirements, and direct your
            enquiry to the appropriate team.
          </p>

          <h3>5.2 Providing Product Information and Quotations</h3>
          <p>
            Where requested, we may use relevant details to provide product specifications,
            availability information, quotations, recommendations, and other information relating
            to Lura Energy's products and services.
          </p>

          <h3>5.3 Supporting Orders and Business Transactions</h3>
          <p>
            Where applicable, personal information may be used to process orders, coordinate
            deliveries, communicate transaction details, maintain customer records, and provide
            updates concerning a purchase or service.
          </p>

          <h3>5.4 Coordinating Installations and Technical Services</h3>
          <p>
            We may use relevant contact and location information to arrange installation
            appointments, coordinate authorised service personnel, communicate scheduling changes,
            and follow up on service requests.
          </p>

          <h3>5.5 Managing Warranties and After-Sales Support</h3>
          <p>
            Information about products, purchase history, service visits, and reported faults may
            be used to assess warranty enquiries, coordinate repairs, explain applicable service
            procedures, and maintain records of support provided.
          </p>

          <h3>5.6 Managing Distributor and Partner Relationships</h3>
          <p>
            We may process business contact information to evaluate partnership requests,
            communicate with distributors and installers, coordinate commercial activities, and
            maintain appropriate business records.
          </p>

          <h3>5.7 Improving Our Website and Services</h3>
          <p>
            Where appropriate, technical information and aggregated usage data may be used to
            identify website issues, improve navigation, evaluate content performance, and
            enhance the accessibility and usefulness of our digital platforms.
          </p>

          <h3>5.8 Maintaining Security and Preventing Misuse</h3>
          <p>
            We may process relevant information to investigate suspected fraud, detect
            unauthorised access, protect website forms against spam, maintain system integrity,
            and address security incidents.
          </p>

          <h3>5.9 Meeting Legal and Regulatory Obligations</h3>
          <p>
            We may process or retain information where necessary to comply with applicable legal
            requirements, respond to lawful requests, establish or defend legal claims, and
            protect our legitimate rights.
          </p>

          <h3>5.10 Marketing and Promotional Communications</h3>
          <p>
            Where permitted by applicable law, we may use relevant contact details to share
            product announcements, company updates, promotions, educational information, and
            other communications related to Lura Energy's products and services.
          </p>
          <p>
            Where consent is required, we will obtain it before sending the relevant marketing
            communications. You may opt out of promotional communications at any time using the
            available unsubscribe mechanism or by contacting us.
          </p>
          <p>
            Opting out of marketing will not prevent us from sending necessary service-related
            communications, such as responses to an active enquiry or important information
            concerning an existing transaction.
          </p>
        </section>

        <section>
          <h2>6. Legal Basis for Processing Personal Information</h2>
          <p>
            Where applicable data protection law requires a lawful basis for processing, Lura
            Energy will rely on the basis appropriate to the circumstances. Depending on the
            activity, these bases may include:
          </p>
          <ul>
            <li>
              <strong>Consent:</strong> Where you have freely agreed to a specific use of your
              personal information and consent is legally required.
            </li>
            <li>
              <strong>Contractual necessity:</strong> Where processing is necessary to take
              steps at your request before entering into a contract or to fulfil an existing
              contractual obligation.
            </li>
            <li>
              <strong>Legal obligation:</strong> Where processing is required to comply with
              applicable law.
            </li>
            <li>
              <strong>Legitimate interests:</strong> Where processing is necessary for a
              legitimate business purpose, provided that your rights and interests are
              appropriately considered and applicable legal requirements are satisfied.
            </li>
            <li>
              <strong>Other lawful grounds:</strong> Where recognised by the data protection
              laws applicable to the relevant processing activity.
            </li>
          </ul>
          <p>
            Where we rely on consent, you may withdraw it, subject to applicable legal
            requirements. Withdrawal does not invalidate processing lawfully carried out before
            consent was withdrawn.
          </p>
        </section>

        <section>
          <h2>7. Contact Forms and Website Enquiries</h2>
          <p>
            Our website may provide contact forms that allow visitors to communicate with Lura
            Energy. When you submit a contact form, we may use the information you provide to:
          </p>
          <ol>
            <li>Receive and record your enquiry.</li>
            <li>Identify the subject of your request.</li>
            <li>Contact you using the details supplied.</li>
            <li>Route your enquiry to the appropriate team.</li>
            <li>Maintain relevant correspondence and follow-up records.</li>
            <li>Address complaints or resolve service issues where applicable.</li>
          </ol>
          <p>
            Please avoid including passwords, payment card details, government identification
            numbers, or other highly sensitive information in a general contact form unless we
            have specifically requested it through an appropriate and secure process.
          </p>
          <p>
            Submitting a contact form does not automatically create a customer account, establish
            a contractual relationship, or guarantee product availability or service acceptance.
          </p>
          <p>
            We will process form submissions according to the purpose of the form, applicable
            law, and our actual operational procedures.
          </p>
        </section>

        <section>
          <h2>8. Cookies and Similar Technologies</h2>
          <p>
            Cookies are small data files that websites may store on a visitor's device. Similar
            technologies may be used to support website functionality, remember preferences,
            measure website usage, or provide other digital services.
          </p>
          <p>
            Depending on the technologies implemented on our website, Lura Energy may use the
            following categories.
          </p>
          <h3>8.1 Essential Cookies</h3>
          <p>
            These cookies may be necessary for core website functionality, security, navigation,
            and the proper operation of certain features.
          </p>
          <h3>8.2 Preference Cookies</h3>
          <p>
            Where implemented, these technologies may remember selected settings or preferences
            to improve your browsing experience.
          </p>
          <h3>8.3 Analytics Cookies</h3>
          <p>
            If analytics tools are used, they may help us understand aggregate website traffic,
            popular pages, navigation patterns, and technical performance.
          </p>
          <h3>8.4 Marketing Cookies</h3>
          <p>
            If advertising or marketing technologies are implemented, they may be used to measure
            campaign performance or support relevant promotional activities, subject to
            applicable consent and legal requirements.
          </p>
          <p>
            <strong>Note:</strong> The categories above describe possible website technologies,
            not a confirmation that every category is currently active on Lura Energy's website.
            See our <Link href="/cookies">Cookie Policy</Link> for the specific cookies we
            currently use.
          </p>
          <p>
            Where required, we will request consent before using non-essential cookies or similar
            technologies. You may also be able to manage cookies through your browser settings.
          </p>
          <p>
            Disabling certain cookies may affect the availability or functionality of some
            website features.
          </p>
        </section>

        <section>
          <h2>9. How We Share Personal Information</h2>
          <p>
            Lura Energy does not treat personal information submitted through our website as
            information that may be freely distributed. We may share relevant information only
            where there is an appropriate business purpose, lawful basis, and applicable
            safeguard.
          </p>

          <h3>9.1 Authorised Employees and Internal Teams</h3>
          <p>
            Information may be made available to authorised personnel who need it to respond to
            enquiries, manage customer relationships, coordinate sales, provide technical
            support, or perform other relevant responsibilities. Access should be limited to
            personnel with a legitimate operational need.
          </p>

          <h3>9.2 Service Providers</h3>
          <p>
            We may use third-party service providers to support activities such as website
            hosting, email delivery, customer communications, security, technical maintenance,
            or business administration. Where these providers process personal information on our
            behalf, we will seek appropriate contractual and organisational safeguards consistent
            with applicable law.
          </p>

          <h3>9.3 Distributors, Installers, and Service Partners</h3>
          <p>
            Where necessary to fulfil a request, coordinate a delivery or installation, or
            provide after-sales assistance, relevant information may be shared with an
            appropriate distributor, installer, delivery provider, or authorised service partner.
            For example, a service partner may need a customer's contact details and service
            location to arrange an agreed appointment. We will seek to limit shared information
            to what is reasonably necessary for the relevant activity.
          </p>

          <h3>9.4 Legal and Regulatory Authorities</h3>
          <p>
            We may disclose information where required or permitted by law, including in response
            to valid legal processes, regulatory obligations, or lawful requests from competent
            authorities.
          </p>

          <h3>9.5 Business Transactions</h3>
          <p>
            If Lura Energy undergoes a merger, restructuring, acquisition, or transfer of
            relevant business operations, personal information may be disclosed to the extent
            reasonably necessary for the transaction and subject to applicable legal protections.
          </p>

          <h3>9.6 With Your Direction or Consent</h3>
          <p>
            We may share information where you specifically request or authorise us to do so,
            subject to applicable law.
          </p>

          <h3>9.7 No Unauthorised Sale of Personal Information</h3>
          <p>
            Lura Energy does not sell personal information submitted through its website as a
            commercial product. Any sharing or disclosure will be assessed according to the
            purpose involved, applicable law, and the safeguards appropriate to the
            circumstances.
          </p>
        </section>

        <section>
          <h2>10. International Data Transfers</h2>
          <p>
            Some of the technology providers or business partners supporting our website and
            operations may process information in countries other than the country in which it
            was collected.
          </p>
          <p>
            Where personal information is transferred internationally, Lura Energy will take the
            steps required by applicable data protection law. Depending on the circumstances,
            these may include assessing the receiving jurisdiction, implementing appropriate
            contractual safeguards, obtaining consent where required, or relying on another
            recognised legal transfer mechanism.
          </p>
          <p>
            International processing will not remove any privacy protections that must legally
            be provided to the relevant individual.
          </p>
          <p>
            The countries involved and the applicable safeguards should be identified where
            required and where they can be established from our actual service-provider
            arrangements.
          </p>
        </section>

        <section>
          <h2>11. Data Retention</h2>
          <p>
            Lura Energy retains personal information only for as long as reasonably necessary
            for the purpose for which it was collected, subject to applicable legal, contractual,
            accounting, warranty, and dispute-resolution requirements.
          </p>
          <p>Retention periods may vary depending on the category of information.</p>
          <ul>
            <li>
              <strong>General enquiries:</strong> Retained for a reasonable period to respond,
              follow up, and maintain relevant communication records.
            </li>
            <li>
              <strong>Customer and transaction records:</strong> Retained as necessary to manage
              the relevant transaction, meet recordkeeping obligations, and address legitimate
              business needs.
            </li>
            <li>
              <strong>Installation and service records:</strong> Retained as necessary to
              coordinate support, document work performed, and manage applicable warranty or
              service obligations.
            </li>
            <li>
              <strong>Distributor and business correspondence:</strong> Retained as necessary to
              manage the relevant commercial relationship and associated obligations.
            </li>
            <li>
              <strong>Technical and security logs:</strong> Retained for a period appropriate to
              system security, troubleshooting, and operational requirements.
            </li>
            <li>
              <strong>Marketing preferences:</strong> Retained as necessary to respect
              communication choices and maintain appropriate suppression records.
            </li>
          </ul>
          <p>
            When personal information is no longer required, we will take reasonable steps to
            delete it, securely destroy it, or anonymise it, subject to any applicable legal
            requirement to retain it.
          </p>
          <p>
            Specific retention periods should be established internally and applied consistently
            with Lura Energy's actual operational needs and legal obligations.
          </p>
        </section>

        <section>
          <h2>12. How We Protect Your Information</h2>
          <p>
            Lura Energy recognises the importance of protecting personal information against
            unauthorised access, alteration, disclosure, loss, destruction, and misuse.
          </p>
          <p>
            Depending on the systems and procedures in place, appropriate safeguards may include:
          </p>
          <ul>
            <li>Restricting access to authorised personnel.</li>
            <li>Using appropriate authentication and access-control mechanisms.</li>
            <li>Applying security updates and maintaining supported software.</li>
            <li>Protecting website communications through HTTPS and appropriate encryption in transit.</li>
            <li>Maintaining suitable server, database, and application security measures.</li>
            <li>Monitoring relevant system activity and investigating suspicious events.</li>
            <li>Training personnel on appropriate information-handling practices.</li>
            <li>Reviewing access permissions and service-provider arrangements.</li>
            <li>Maintaining appropriate backup, recovery, and incident-response procedures.</li>
          </ul>
          <p>
            No website, digital platform, or method of electronic transmission can be guaranteed
            to be completely secure. Although we aim to apply appropriate safeguards, we cannot
            promise absolute security in every circumstance.
          </p>
          <p>
            Security statements should be read as a description of the measures appropriate to
            our systems, rather than a guarantee that every listed control is currently
            implemented.
          </p>
        </section>

        <section>
          <h2>13. Personal Data Breaches and Security Incidents</h2>
          <p>
            If Lura Energy becomes aware of a personal data breach affecting information under
            its responsibility, we will assess the incident and take reasonable steps to contain,
            investigate, and address it.
          </p>
          <p>
            Where required by applicable law, we will notify the relevant data protection
            authority and affected individuals within the applicable time limits and provide
            information concerning the nature of the incident, likely consequences, and
            appropriate protective measures.
          </p>
          <p>
            We may also take steps to restore affected services, prevent recurrence, and document
            the incident in accordance with relevant legal obligations.
          </p>
        </section>

        <section>
          <h2>14. Your Privacy Rights</h2>
          <p>
            Depending on the data protection laws applicable to you and the circumstances of the
            processing, you may have rights concerning your personal information. These may
            include the right to:
          </p>
          <h3>14.1 Request Access</h3>
          <p>
            Ask whether we process your personal information and request access to relevant
            information held about you.
          </p>
          <h3>14.2 Request Correction</h3>
          <p>Ask us to correct information that is inaccurate, incomplete, or out of date.</p>
          <h3>14.3 Request Deletion</h3>
          <p>
            Ask us to delete personal information where the applicable legal requirements are
            satisfied and no lawful retention requirement applies.
          </p>
          <h3>14.4 Object to Processing</h3>
          <p>
            Object to certain processing activities where the law provides this right, including
            certain processing based on legitimate interests.
          </p>
          <h3>14.5 Restrict Processing</h3>
          <p>
            Request restriction of certain processing activities in circumstances recognised by
            applicable law.
          </p>
          <h3>14.6 Withdraw Consent</h3>
          <p>
            Withdraw consent where our processing relies on consent. This will not affect the
            lawfulness of processing undertaken before withdrawal.
          </p>
          <h3>14.7 Request Data Portability</h3>
          <p>
            Where applicable, request a copy of qualifying personal information in a structured,
            commonly used, machine-readable format.
          </p>
          <h3>14.8 Object to Direct Marketing</h3>
          <p>
            Ask us to stop using your personal information for direct marketing. We will respect
            applicable legal requirements concerning such requests.
          </p>
          <h3>14.9 Lodge a Complaint</h3>
          <p>
            Raise a privacy concern with us or complain to the competent data protection
            authority where you believe your information has been handled unlawfully.
          </p>
          <p>
            These rights are subject to applicable legal conditions and exceptions. For example,
            we may be required to retain certain records or may need to verify your identity
            before acting on a request. We will explain where a request cannot be fulfilled in
            full, to the extent required by law.
          </p>
        </section>

        <section>
          <h2>15. Privacy and Data Protection in Nigeria</h2>
          <p>
            Lura Energy operates in Nigeria and recognises the importance of handling personal
            information in accordance with applicable Nigerian data protection requirements.
          </p>
          <p>
            Where applicable, our processing activities will be assessed against the Nigeria Data
            Protection Act 2023, relevant regulations, and other applicable legal requirements.
          </p>
          <p>
            Our approach is intended to support transparency, appropriate collection, lawful use,
            responsible disclosure, security, and respect for individuals' privacy rights.
          </p>
          <p>
            The precise legal obligations that apply may depend on the nature of the processing,
            the individuals concerned, and the relevant circumstances.
          </p>
          <p>
            Nothing in this policy is intended to exclude or limit a privacy right that cannot
            lawfully be excluded or limited.
          </p>
        </section>

        <section>
          <h2>16. Children's Privacy</h2>
          <p>
            Lura Energy's website and commercial services are generally intended for individuals
            and organisations seeking information about energy products and related business
            services.
          </p>
          <p>
            We do not knowingly seek to collect personal information from children in
            circumstances where such collection is not permitted by applicable law.
          </p>
          <p>
            Where information concerning a child is collected inadvertently or without an
            appropriate legal basis, we will assess the circumstances and take reasonable
            corrective action as required by law.
          </p>
          <p>
            Parents, guardians, or other individuals with a relevant legal responsibility may
            contact us if they believe a child has provided personal information improperly.
          </p>
        </section>

        <section>
          <h2>17. Third-Party Websites and External Links</h2>
          <p>
            Our website may contain links to third-party websites, platforms, social media
            accounts, product resources, or external services. These links may be provided for
            convenience, product information, customer support, or other relevant purposes.
          </p>
          <p>
            Lura Energy does not control the privacy practices, security measures, or content of
            third-party websites merely because we link to them.
          </p>
          <p>
            When you follow an external link, the privacy policy and terms of the relevant third
            party may apply. We encourage you to review those documents before providing
            personal information to an external service.
          </p>
          <p>
            The inclusion of a link does not necessarily constitute an endorsement of every
            privacy practice or statement made by the linked organisation.
          </p>
        </section>

        <section>
          <h2>18. Social Media and Digital Communications</h2>
          <p>
            Lura Energy may maintain social media accounts and other digital communication
            channels to share product information, educational content, company updates,
            promotional materials, and customer support information.
          </p>
          <p>
            If you contact us through a social media platform, the information you submit may be
            processed both by Lura Energy and by the platform provider under its own privacy
            terms.
          </p>
          <p>
            Messages, comments, photographs, and other material posted publicly may be visible
            to other users. Please avoid publishing private contact information, sensitive
            documents, or confidential technical details in public comment sections.
          </p>
          <p>
            Where necessary, we may invite you to continue a customer support conversation
            through a more appropriate communication channel.
          </p>
        </section>

        <section>
          <h2>19. Communications and Marketing Preferences</h2>
          <p>
            You may receive service-related communications when you submit an enquiry, request a
            quotation, arrange an installation, or enter into a business relationship with Lura
            Energy.
          </p>
          <p>
            Where legally permitted, we may also send promotional communications concerning
            relevant products, services, offers, company activities, and industry information.
          </p>
          <p>
            You can opt out of promotional emails by using the unsubscribe option where available
            or contacting us directly.
          </p>
          <p>
            If you ask us to stop marketing communications, we will take reasonable steps to
            update your preferences within the period required by applicable law.
          </p>
          <p>
            Please note that we may continue to retain a limited record of your preference where
            necessary to ensure that your opt-out request is respected.
          </p>
        </section>

        <section>
          <h2>20. Your Responsibilities When Providing Information</h2>
          <p>
            To help us handle your personal information appropriately, we encourage you to:
          </p>
          <ul>
            <li>Provide accurate and relevant information when submitting an enquiry.</li>
            <li>Update us if essential contact information changes.</li>
            <li>Avoid sharing passwords or confidential credentials through general website forms.</li>
            <li>
              Only submit personal information belonging to another person where you have the
              appropriate authority or lawful basis to do so.
            </li>
            <li>Review the privacy terms of third-party platforms you choose to use.</li>
            <li>
              Contact us if you believe your information has been submitted or used improperly.
            </li>
          </ul>
          <p>
            Providing accurate information helps us respond efficiently and coordinate the
            services you request.
          </p>
        </section>

        <section>
          <h2>21. Changes to This Privacy Policy</h2>
          <p>
            Lura Energy may update this Privacy Policy from time to time to reflect changes in
            our business activities, website functionality, technology, service-provider
            arrangements, or applicable legal requirements.
          </p>
          <p>
            When changes are made, we will update the "Last Updated" date shown at the beginning
            of this page.
          </p>
          <p>
            Where a material change requires additional notice or consent under applicable law,
            we will take the appropriate steps.
          </p>
          <p>
            We encourage visitors and customers to review this page periodically to remain
            informed about how their personal information is handled.
          </p>
          <p>
            Any revised policy will apply from the effective date indicated in the published
            version, subject to applicable legal requirements.
          </p>
        </section>

        <section>
          <h2>22. Contact Lura Energy About Privacy</h2>
          <p>
            If you have questions about this Privacy Policy, wish to exercise an applicable
            privacy right, or would like to raise a concern about the handling of your personal
            information, please contact Lura Energy through the official communication channels
            published on our website.
          </p>
          <p>
            When submitting a privacy request, please provide sufficient information for us to
            understand your concern and, where reasonably necessary, verify your identity.
          </p>
          <p>
            Please do not send passwords, full payment card details, or unnecessary sensitive
            personal information in your initial request.
          </p>
          <p>
            We will review your request and respond in accordance with applicable law and our
            relevant procedures.
          </p>
          <p>
            <strong>Privacy Enquiries</strong>
          </p>
          <ul>
            <li><strong>Organisation:</strong> Lura Energy</li>
            <li><strong>Website:</strong> https://luraenergy.com</li>
            <li><strong>Email:</strong> <a href="mailto:privacy@luraenergy.com">privacy@luraenergy.com</a></li>
            <li><strong>Business Address:</strong> [Insert verified business address]</li>
            <li><strong>Privacy Contact:</strong> [Insert designated privacy contact, if applicable]</li>
          </ul>
          <p>
            If Lura Energy designates a Data Protection Officer or another formal privacy
            representative, their verified contact details should be provided here where
            required.
          </p>
        </section>

        <section>
          <h2>23. Our Commitment to Responsible Data Handling</h2>
          <p>
            At Lura Energy, customer trust is important to the relationships we build with
            homeowners, businesses, distributors, installers, and other partners.
          </p>
          <p>
            We aim to collect only relevant information, use it for appropriate purposes, limit
            access to authorised individuals, apply reasonable safeguards, and respect the
            privacy rights provided by applicable law.
          </p>
          <p>
            Whether you are exploring solar energy solutions, requesting product information,
            contacting our service team, or considering a business partnership, we are committed
            to treating your personal information with care and transparency.
          </p>
          <p>Thank you for trusting Lura Energy.</p>
          <p>
            <strong>Lura Energy — Home of Premium Solar.</strong>
          </p>
        </section>
      </div>
    </main>
  );
}