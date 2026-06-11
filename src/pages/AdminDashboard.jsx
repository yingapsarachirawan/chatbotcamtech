/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  getAdminInbox,
  getEnquiryDetail,
  sendAdminReply,
} from "../services/adminApi";
import logo from "../assets/logo.jpg";
import "./AdminDashboard.css";

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getInitials(name) {
  return String(name || "S").trim().charAt(0).toUpperCase();
}

function safeStatus(status) {
  return String(status || "New");
}

function getStatusClass(status) {
  return safeStatus(status).toLowerCase().replace(/\s+/g, "-");
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5C4 4.67 4.67 4 5.5 4h5C11.33 4 12 4.67 12 5.5v5c0 .83-.67 1.5-1.5 1.5h-5C4.67 12 4 11.33 4 10.5v-5Z" />
      <path d="M14 5.5c0-.83.67-1.5 1.5-1.5h3c.83 0 1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5h-3c-.83 0-1.5-.67-1.5-1.5v-3Z" />
      <path d="M14 13.5c0-.83.67-1.5 1.5-1.5h3c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5h-3c-.83 0-1.5-.67-1.5-1.5v-5Z" />
      <path d="M4 15.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5h-5C4.67 20 4 19.33 4 18.5v-3Z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6.5C5 5.67 5.67 5 6.5 5h11c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5H9l-4 4V6.5Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12 20 5l-5.5 14-3-5.5L4 12Z" />
      <path d="m11.5 13.5 3-3" />
    </svg>
  );
}

export default function AdminDashboard({ onLogout, onBackToChat }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [inboxData, setInboxData] = useState(null);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadInbox(options = {}) {
    const silent = options.silent === true;

    if (!silent) {
      setIsLoadingInbox(true);
    }

    setErrorMessage("");

    try {
      const data = await getAdminInbox();
      setInboxData(data);

      if (!selectedEnquiryId && data?.enquiries?.length > 0) {
        setSelectedEnquiryId(data.enquiries[0].id);
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to load inbox.");
    } finally {
      if (!silent) {
        setIsLoadingInbox(false);
      }
    }
  }

  async function loadDetail(enquiryId, options = {}) {
    if (!enquiryId) return;

    const silent = options.silent === true;

    if (!silent) {
      setIsLoadingDetail(true);
    }

    setErrorMessage("");

    try {
      const data = await getEnquiryDetail(enquiryId);
      setSelectedDetail(data);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load enquiry.");
    } finally {
      if (!silent) {
        setIsLoadingDetail(false);
      }
    }
  }

  useEffect(() => {
    loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEnquiryId) {
      loadDetail(selectedEnquiryId);
    }
  }, [selectedEnquiryId]);

  async function handleSendReply(event) {
    event.preventDefault();

    const message = replyText.trim();

    if (!message || !selectedDetail?.enquiry?.id || isSendingReply) return;

    const enquiryId = selectedDetail.enquiry.id;

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      sender: "admin",
      message,
      created_at: new Date().toISOString(),
    };

    setReplyText("");
    setIsSendingReply(true);

    setSelectedDetail((current) =>
      current
        ? {
            ...current,
            messages: [...(current.messages || []), optimisticMessage],
          }
        : current
    );

    try {
      await sendAdminReply(enquiryId, message);
      await loadInbox({ silent: true });
      await loadDetail(enquiryId, { silent: true });
    } catch (error) {
      alert(error.message || "Unable to send reply.");
      await loadDetail(enquiryId, { silent: true });
    } finally {
      setIsSendingReply(false);
    }
  }

  function handleReplyKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!isSendingReply && replyText.trim()) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    onLogout?.();
  }

  function openMessage(enquiryId) {
    setSelectedEnquiryId(enquiryId);
    setActiveSection("messages");
  }

  const stats = inboxData?.stats || {
    totalEnquiries: 0,
    newEnquiries: 0,
    inProgressEnquiries: 0,
    resolvedEnquiries: 0,
    todayEnquiries: 0,
  };

  const enquiries = inboxData?.enquiries || [];
  const selectedEnquiry = selectedDetail?.enquiry;
  const messages = selectedDetail?.messages || [];
  const recentEnquiries = enquiries.slice(0, 5);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src={logo} alt="CamTech logo" />

          <div>
            <h1>CamTech</h1>
            <p>Admin Console</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button
            type="button"
            className={activeSection === "dashboard" ? "active" : ""}
            onClick={() => setActiveSection("dashboard")}
          >
            <span>
              <DashboardIcon />
            </span>
            Dashboard
          </button>

          <button
            type="button"
            className={activeSection === "messages" ? "active" : ""}
            onClick={() => setActiveSection("messages")}
          >
            <span>
              <MessageIcon />
            </span>
            Messages
            {stats.newEnquiries > 0 && <em>{stats.newEnquiries}</em>}
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-online">
            <span />
            Admin online
          </div>

          <button type="button" onClick={onBackToChat}>
            Back to Chatbot
          </button>

          <button type="button" onClick={handleLogout} className="logout">
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-app">
        <header className="admin-topbar">
          <div className="admin-topbrand">
            <div>
              <p>
                {activeSection === "dashboard"
                  ? "CamTech Admin"
                  : "Message Center"}
              </p>

              <h1>
                {activeSection === "dashboard"
                  ? "Admin Dashboard"
                  : "Student Messages"}
              </h1>

              <span>
                {activeSection === "dashboard"
                  ? "Monitor enquiries, support progress, and recent student activity."
                  : "View student enquiries and reply from the admin message workspace."}
              </span>
            </div>
          </div>

          <div className="admin-top-actions">
            <button type="button" onClick={() => loadInbox()}>
              Refresh
            </button>
          </div>
        </header>

        {errorMessage && <div className="admin-alert">{errorMessage}</div>}

        {activeSection === "dashboard" ? (
          <section className="admin-dashboard-view">
            <div className="admin-overview-card">
              <div className="admin-overview-icon">
                <DashboardIcon />
              </div>

              <div>
                <p>Admin Overview</p>
                <h2>Support dashboard</h2>
                <span>
                  Manage student enquiries, track support activity, and open
                  messages when a student needs a reply.
                </span>
              </div>

              <button type="button" onClick={() => setActiveSection("messages")}>
                Open Messages
              </button>
            </div>

            <section className="admin-summary">
              <div>
                <span>Total</span>
                <strong>{stats.totalEnquiries}</strong>
                <p>All enquiries</p>
              </div>

              <div>
                <span>New</span>
                <strong>{stats.newEnquiries}</strong>
                <p>Need review</p>
              </div>

              <div>
                <span>In Progress</span>
                <strong>{stats.inProgressEnquiries}</strong>
                <p>Being handled</p>
              </div>

              <div>
                <span>Resolved</span>
                <strong>{stats.resolvedEnquiries}</strong>
                <p>Completed</p>
              </div>
            </section>

            <div className="admin-dashboard-grid">
              <section className="admin-panel-card admin-recent-card">
                <div className="admin-section-title">
                  <div>
                    <h2>Recent enquiries</h2>
                    <p>Latest students who contacted admissions support</p>
                  </div>
                </div>

                {isLoadingInbox ? (
                  <div className="admin-empty">Loading enquiries...</div>
                ) : recentEnquiries.length > 0 ? (
                  <div className="admin-recent-list">
                    {recentEnquiries.map((item) => {
                      const status = safeStatus(item.status);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="admin-recent-item"
                          onClick={() => openMessage(item.id)}
                        >
                          <div className="admin-avatar">
                            {getInitials(item.name)}
                          </div>

                          <div>
                            <strong>{item.name || "Student"}</strong>
                            <p>{item.message || "No message preview."}</p>
                          </div>

                          <em
                            className={`admin-status status-${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </em>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="admin-empty">No enquiries yet.</div>
                )}
              </section>

              <section className="admin-panel-card">
                <div className="admin-section-title">
                  <div>
                    <h2>Support workflow</h2>
                    <p>Recommended handling process</p>
                  </div>
                </div>

                <div className="admin-flow">
                  <div>
                    <span>1</span>
                    <p>Review new enquiry</p>
                  </div>

                  <div>
                    <span>2</span>
                    <p>Open the message workspace</p>
                  </div>

                  <div>
                    <span>3</span>
                    <p>Reply to the student</p>
                  </div>

                  <div>
                    <span>4</span>
                    <p>Continue conversation until solved</p>
                  </div>
                </div>
              </section>
            </div>
          </section>
        ) : (
          <section className="admin-chat-layout">
            <aside className="admin-inbox">
              <div className="admin-section-title">
                <div>
                  <h2>Student enquiries</h2>
                  <p>{enquiries.length} conversation</p>
                </div>
              </div>

              {isLoadingInbox ? (
                <div className="admin-empty">Loading enquiries...</div>
              ) : enquiries.length > 0 ? (
                <div className="admin-inbox-list">
                  {enquiries.map((item) => {
                    const status = safeStatus(item.status);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`admin-inbox-item ${
                          selectedEnquiryId === item.id ? "active" : ""
                        }`}
                        onClick={() => setSelectedEnquiryId(item.id)}
                      >
                        <div className="admin-avatar">
                          {getInitials(item.name)}
                        </div>

                        <div className="admin-inbox-content">
                          <div className="admin-inbox-row">
                            <strong>{item.name || "Student"}</strong>
                            <span>{formatDate(item.created_at)}</span>
                          </div>

                          <p>{item.message || "No message preview."}</p>

                          <div className="admin-inbox-meta">
                            <span>
                              {item.interested_program || "General enquiry"}
                            </span>

                            <em
                              className={`admin-status status-${getStatusClass(
                                status
                              )}`}
                            >
                              {status}
                            </em>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="admin-empty">No enquiries yet.</div>
              )}
            </aside>

            <section className="admin-conversation">
              {!selectedEnquiryId ? (
                <div className="admin-empty center">
                  Select an enquiry to view the conversation.
                </div>
              ) : isLoadingDetail ? (
                <div className="admin-empty center">Loading conversation...</div>
              ) : selectedEnquiry ? (
                <>
                  <div className="admin-conversation-header">
                    <div className="admin-profile">
                      <div className="admin-avatar large">
                        {getInitials(selectedEnquiry.name)}
                      </div>

                      <div>
                        <h2>{selectedEnquiry.name || "Student"}</h2>
                        <p>
                          {selectedEnquiry.email || "No email"} ·{" "}
                          {selectedEnquiry.phone || "No phone"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="admin-detail-strip">
                    <div>
                      <span>Program</span>
                      <strong>
                        {selectedEnquiry.interested_program ||
                          "General enquiry"}
                      </strong>
                    </div>

                    <div>
                      <span>Created</span>
                      <strong>{formatDate(selectedEnquiry.created_at)}</strong>
                    </div>
                  </div>

                  <div className="admin-message-thread">
                    {messages.length > 0 ? (
                      messages.map((item) => {
                        const isAdmin = item.sender === "admin";

                        return (
                          <div
                            key={item.id}
                            className={`admin-message ${
                              isAdmin
                                ? "admin-message-admin"
                                : "admin-message-student"
                            }`}
                          >
                            <div className="admin-message-bubble">
                              <div className="admin-message-head">
                                <strong>
                                  {isAdmin ? "CamTech Admin" : "Student"}
                                </strong>
                                <span>{formatDate(item.created_at)}</span>
                              </div>

                              <p>{item.message}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="admin-empty">No messages yet.</div>
                    )}
                  </div>

                  <form className="admin-composer" onSubmit={handleSendReply}>
                    <textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      onKeyDown={handleReplyKeyDown}
                      placeholder={
                        selectedEnquiry.status === "Closed"
                          ? "This enquiry is closed."
                          : "Write a reply... Enter to send, Shift + Enter for new line"
                      }
                      rows="2"
                      disabled={selectedEnquiry.status === "Closed"}
                    />

                    <button
                      type="submit"
                      disabled={
                        isSendingReply ||
                        !replyText.trim() ||
                        selectedEnquiry.status === "Closed"
                      }
                      aria-label="Send message"
                    >
                      {isSendingReply ? "..." : <SendIcon />}
                    </button>
                  </form>
                </>
              ) : (
                <div className="admin-empty center">
                  Could not load this enquiry.
                </div>
              )}
            </section>
          </section>
        )}
      </main>
    </div>
  );
}