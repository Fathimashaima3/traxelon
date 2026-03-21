import React, { useState } from "react";
import { Shield, FileText, AlertTriangle, Lock, Users, Scale, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    id: 1,
    icon: <Users className="w-5 h-5" />,
    title: "Eligibility & Access",
    content: [
      "Traxelon is exclusively available to verified, active-duty law enforcement officers, government investigators, and authorized personnel of Indian state and central police departments.",
      "Access is granted only upon successful verification of a valid government-issued Badge ID, official email address, and departmental authorization.",
      "Any attempt to access this platform without valid credentials constitutes unauthorized access under Section 66 of the Information Technology Act, 2000 and is liable for criminal prosecution.",
      "Users must be at least 18 years of age and must be currently employed by a recognized law enforcement or government investigative agency.",
    ],
  },
  {
    id: 2,
    icon: <Lock className="w-5 h-5" />,
    title: "Permitted Use & Restrictions",
    content: [
      "This platform may only be used for lawful investigative purposes in connection with active criminal investigations, subject to proper judicial or superior officer authorization.",
      "Users must obtain appropriate legal authority (court orders, search warrants, or equivalent authorization under BNSS) before initiating any surveillance or tracking operation.",
      "Strictly prohibited: personal surveillance, unauthorized monitoring of individuals, use for political purposes, sharing platform data with unauthorized third parties, or any activity outside official law enforcement duties.",
      "Each query, search, and surveillance operation is logged with timestamp, user credentials, and purpose. These logs are retained for a minimum of 5 years and are auditable by superior officers and judicial authorities.",
      "Users must not share login credentials, bypass security measures, or attempt to access data beyond their authorized jurisdiction.",
    ],
  },
  {
    id: 3,
    icon: <Scale className="w-5 h-5" />,
    title: "Legal Compliance & Governing Law",
    content: [
      "All operations conducted through Traxelon must comply with the Information Technology Act, 2000; the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023; the Digital Personal Data Protection Act (DPDPA), 2023; the Indian Telegraph Act, 1885; and all applicable state and central laws.",
      "The platform strictly adheres to the Supreme Court of India's guidelines on privacy (Justice K.S. Puttaswamy v. Union of India, 2017) and proportionality in surveillance.",
      "These Terms and Conditions are governed by the laws of India. Any disputes arising from the use of this platform shall be subject to the exclusive jurisdiction of courts in Mangalore, Karnataka.",
      "Traxelon reserves the right to report any illegal or unauthorized use to appropriate authorities and to cooperate fully with any judicial or departmental investigation.",
    ],
  },
  {
    id: 4,
    icon: <Shield className="w-5 h-5" />,
    title: "Data Privacy & Security",
    content: [
      "All data processed through Traxelon is encrypted using AES-256 encryption in transit and at rest. Access to subject data is strictly role-based and need-to-know.",
      "Traxelon does not sell, share, or commercially exploit any data processed through the platform. All subject data is used solely for the stated law enforcement purpose.",
      "Users are responsible for maintaining the confidentiality of investigation data accessed through this platform. Unauthorized disclosure of such data may violate the Official Secrets Act, 1923.",
      "Data retention policies comply with the DPDPA 2023 and government directives. Users may request audit logs of their own activity through the departmental administrator.",
      "In the event of a data breach, affected users and relevant authorities will be notified within 72 hours as per applicable regulations.",
    ],
  },
  {
    id: 5,
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "Accountability & Consequences",
    content: [
      "Every user is personally accountable for all actions performed under their credentials. Sharing access credentials is strictly prohibited and will result in immediate account suspension.",
      "Misuse of the platform, including unauthorized surveillance, data misappropriation, or access beyond authorized scope, will result in immediate termination of access, departmental disciplinary action, and criminal prosecution under applicable laws.",
      "Traxelon maintains complete audit trails. Any anomalous activity triggers automatic alerts to the designated departmental security officer.",
      "Officers found guilty of misuse may face prosecution under Section 66 (Computer Related Offences), Section 72 (Breach of Confidentiality), and other relevant provisions of the IT Act, 2000.",
    ],
  },
  {
    id: 6,
    icon: <FileText className="w-5 h-5" />,
    title: "Platform Disclaimer & Limitations",
    content: [
      "Traxelon provides investigative intelligence tools as an aid to law enforcement. The platform does not guarantee the absolute accuracy, completeness, or real-time nature of all data presented.",
      "Users must exercise independent professional judgment when acting on information obtained through this platform. Traxelon shall not be held liable for decisions made solely on the basis of platform data.",
      "The platform may be subject to scheduled maintenance, during which access may be temporarily unavailable. Critical operations should not be solely dependent on platform availability.",
      "Traxelon reserves the right to modify, suspend, or terminate access at any time, with or without notice, particularly in cases of suspected misuse or security threats.",
      "These Terms and Conditions may be updated periodically. Continued use of the platform following any update constitutes acceptance of the revised terms.",
    ],
  },
];

export default function TermsAndConditions() {
  const [openSection, setOpenSection] = useState(null);

  const toggle = (id) => setOpenSection(openSection === id ? null : id);

  return (
    <div className="min-h-screen bg-surface text-text-primary overflow-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-[40vh] flex items-center justify-center pt-24 pb-12">
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 animate-scan-line pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-surface-card border border-primary/30 rounded-full px-5 py-2 mb-8">
            <Activity className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="font-mono text-xs text-primary tracking-wider uppercase whitespace-nowrap">
              Legal Documentation · Effective 2026
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-none mb-6 tracking-wider">
            TERMS OF <span className="text-primary" style={{ textShadow: "0 0 40px rgba(0,212,255,0.5)" }}>
              SERVICES
            </span>
          </h1>

          <p className="font-body text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            By accessing Traxelon, you agree to these terms in full. This platform is strictly
            for authorized law enforcement personnel conducting lawful investigations.
          </p>

          {/* Warning Banner */}
          <div className="mt-8 inline-flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-xl px-5 py-3">
            <AlertTriangle className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="font-mono text-xs text-accent tracking-wide">
              UNAUTHORIZED ACCESS IS A CRIMINAL OFFENCE UNDER IT ACT 2000
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-4">

        {/* Last Updated */}
        <div className="flex items-center justify-between mb-8">
          <p className="font-mono text-xs text-text-muted">Last updated: March 2026</p>
          <p className="font-mono text-xs text-text-muted">Version 1.0</p>
        </div>

        {/* Intro Card */}
        <div className="bg-surface-elevated border border-primary/20 rounded-2xl p-6 mb-8">
          <div className="h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 -mt-6 mb-6 -mx-6 rounded-t-2xl" />
          <p className="font-body text-sm text-text-secondary leading-relaxed">
            These Terms and Conditions ("Terms") govern your access to and use of the Traxelon Intelligence Platform
            ("Platform"), operated by <span className="text-primary font-semibold">TorSecure Cyber LLP</span> under
            the guidance of <span className="text-primary font-semibold">Dr. Ananth Prabhu G</span>, Principal
            Investigator, Digital Forensics & Cyber Security CoE, Sahyadri College of Engineering and Management.
            By logging in or using the Platform in any manner, you acknowledge that you have read, understood, and
            agree to be bound by these Terms and all applicable laws of India.
          </p>
        </div>

        {/* Accordion Sections */}
        {sections.map((section) => (
          <div key={section.id}
            className={`bg-surface-elevated border rounded-2xl overflow-hidden transition-all duration-300 ${
              openSection === section.id ? "border-primary/40" : "border-surface-border hover:border-primary/20"
            }`}>

            {/* Section Header */}
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center justify-between p-6 text-left group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  openSection === section.id
                    ? "bg-primary/20 border border-primary/40 text-primary"
                    : "bg-surface border border-surface-border text-text-muted group-hover:text-primary group-hover:border-primary/30"
                }`}>
                  {section.icon}
                </div>
                <div>
                  <span className="font-mono text-xs text-text-muted">0{section.id}</span>
                  <h3 className={`font-display text-xl tracking-wide transition-colors ${
                    openSection === section.id ? "text-primary" : "text-text-primary"
                  }`}>
                    {section.title}
                  </h3>
                </div>
              </div>
              <div className={`transition-colors ${openSection === section.id ? "text-primary" : "text-text-muted"}`}>
                {openSection === section.id
                  ? <ChevronUp className="w-5 h-5" />
                  : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {/* Section Content */}
            {openSection === section.id && (
              <div className="px-6 pb-6">
                <div className="h-px bg-surface-border mb-5" />
                <ul className="space-y-3">
                  {section.content.map((point, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="font-body text-sm text-text-secondary leading-relaxed">{point}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {/* Acceptance Block */}
        <div className="bg-surface-elevated border border-accent/20 rounded-2xl p-6 mt-8">
          <h3 className="font-display text-xl text-accent tracking-wide mb-3">⚠️ Acceptance of Terms</h3>
          <p className="font-body text-sm text-text-secondary leading-relaxed">
            By accessing or using the Traxelon platform, you confirm that you are an authorized law enforcement
            officer, that you have read and understood these Terms, and that you agree to comply with all
            applicable laws. If you do not agree to these Terms, you must immediately cease use of the platform
            and notify your departmental administrator. All activity on this platform is monitored, logged,
            and subject to audit by authorized supervisory personnel and judicial authorities.
          </p>
        </div>

        {/* Contact for Legal */}
        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 mt-4">
          <p className="font-body text-sm text-text-muted">
            For legal inquiries regarding these Terms, contact:{" "}
            <a href="mailto:support@traxelon.com" className="text-primary hover:underline">
              support@traxelon.com
            </a>
            {" "}· Torsecure Cyber LLP ,Door No. 4-9-765/17, Second Floor, Manasa Towers, MG Road, Kodialbail, Mangalore, Karnataka
          </p>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-border py-8 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display text-lg tracking-widest text-text-primary">
              TRAX<span className="text-primary">ELON</span>
            </span>
          </div>
          <p className="font-body text-xs text-text-muted">© 2026 Traxelon. Authorized law enforcement use only.</p>
          <div className="flex gap-6">
            <Link to="/" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Home</Link>
            <Link to="/about" className="font-body text-xs text-text-muted hover:text-primary transition-colors">About</Link>
            <Link to="/contact" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
