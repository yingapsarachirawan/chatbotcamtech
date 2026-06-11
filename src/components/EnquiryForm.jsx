import { useState } from "react";
import { submitEnquiry } from "../services/enquiryApi";

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
    <div className="enquiry-overlay">
      <div className="enquiry-modal">
        <div className="enquiry-header">
          <div>
            <p className="enquiry-kicker">Admissions support</p>
            <h2>Contact CamTech Admissions</h2>
            <p>
              Share your details and a CamTech staff member can follow up with
              you.
            </p>
          </div>

          <button type="button" className="enquiry-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="enquiry-form" onSubmit={handleSubmit}>
          <label>
            Full name <span>*</span>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </label>

          <div className="enquiry-grid">
            <label>
              Email
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </label>

            <label>
              Phone
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+855..."
              />
            </label>
          </div>

          <label>
            Interested program
            <input
              name="interestedProgram"
              value={formData.interestedProgram}
              onChange={handleChange}
              placeholder="e.g. Software Engineering"
            />
          </label>

          <label>
            Message <span>*</span>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              placeholder="How can admissions help you?"
            />
          </label>

          {errorMessage && <p className="enquiry-error">{errorMessage}</p>}

          <div className="enquiry-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit enquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}