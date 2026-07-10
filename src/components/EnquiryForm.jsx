import { useState } from "react";
import { Headphones, Mail, Phone, User, X } from "lucide-react";
import { submitEnquiry } from "../services/enquiryApi";
import logo from "../assets/logo.jpg";

export default function EnquiryForm({ onClose, onSubmitted }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    interestedProgram: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const message = formData.message.trim();

    if (!name) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!email && !phone) {
      setErrorMessage("Please provide an email or phone number.");
      return;
    }

    if (!message) {
      setErrorMessage("Please enter your enquiry message.");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitEnquiry({
        ...formData,
        name,
        email,
        phone,
        message,
      });

      onSubmitted?.();
      onClose?.();
    } catch (error) {
      setErrorMessage(error.message || "Unable to submit enquiry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="enquiry-overlay clean-enquiry-overlay">
      <div className="enquiry-modal clean-enquiry-modal">
        <button
          type="button"
          className="enquiry-close clean-enquiry-close"
          onClick={onClose}
          aria-label="Close enquiry form"
        >
          <X size={18} />
        </button>

        <div className="clean-enquiry-hero">
          <div className="clean-enquiry-logo">
            <img src={logo} alt="CamTech logo" />
          </div>

          <div>
            <p className="enquiry-kicker clean-enquiry-kicker">
              Admissions Support
            </p>

            <h2>Contact CamTech Admissions</h2>

            <span>
              Share your details and continue the conversation with our
              admissions team.
            </span>
          </div>
        </div>

        <form className="enquiry-form clean-enquiry-form" onSubmit={handleSubmit}>
          <label className="clean-field">
            <span>
              Full name <em>*</em>
            </span>

            <div className="clean-field-shell">
              <User size={17} />
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>
          </label>

          <div className="enquiry-grid clean-enquiry-grid">
            <label className="clean-field">
              <span>Email</span>

              <div className="clean-field-shell">
                <Mail size={17} />
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label className="clean-field">
              <span>Phone</span>

              <div className="clean-field-shell">
                <Phone size={17} />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+855..."
                />
              </div>
            </label>
          </div>

          <label className="clean-field">
            <span>Interested program</span>

            <div className="clean-field-shell">
              <Headphones size={17} />
              <input
                name="interestedProgram"
                value={formData.interestedProgram}
                onChange={handleChange}
                placeholder="e.g. Software Engineering"
              />
            </div>
          </label>

          <label className="clean-field">
            <span>
              Message <em>*</em>
            </span>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              placeholder="How can admissions help you?"
            />
          </label>

          {errorMessage && <p className="enquiry-error">{errorMessage}</p>}

          <div className="enquiry-actions clean-enquiry-actions">
            <button
              type="button"
              className="secondary-button clean-secondary-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button clean-primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Start conversation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}