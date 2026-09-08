import React from "react";
import { LuMail, LuPhone, LuUserRound, LuX } from "react-icons/lu";

const ContactPickerModal = ({ lead, contacts = [], onClose, onSelect }) => (
  <div className="modal-overlay contact-picker-overlay" onClick={onClose}>
    <div className="modal-content contact-picker-modal" onClick={(event) => event.stopPropagation()}>
      <header className="modal-header">
        <div className="header-info">
          <h2>Select Contact Person</h2>
          <p>{lead?.companyName || "Lead Company"}</p>
        </div>
        <button className="close-btn" onClick={onClose}>
          <LuX />
        </button>
      </header>

      <div className="modal-body contact-picker-body">
        <p className="contact-picker-copy">Choose who you talked to for this follow-up.</p>

        <div className="contact-picker-list">
          {contacts.map((contact, index) => (
            <button
              type="button"
              key={`activity-contact-${index}-${contact.phone || contact.email || contact.fullName}`}
              className="contact-picker-item"
              onClick={() => onSelect(contact)}
            >
              <span className="contact-picker-name">
                <LuUserRound />
                {contact.fullName || "Unnamed Contact"}
              </span>

              <span className="contact-picker-meta">
                <LuPhone />
                {contact.phone || "Phone not available"}
              </span>

              <span className="contact-picker-meta">
                <LuMail />
                {contact.email || "Email not available"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default ContactPickerModal;
