/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Globe2,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  RefreshCw,
  Send,
  SendHorizontal,
  Settings,
} from "lucide-react";
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name) {
  return String(name || "S").trim().charAt(0).toUpperCase();
}

function safeStatus(status) {
  return String(status || "New");
}

function isEndedStatus(status) {
  const value = safeStatus(status).toLowerCase();
  return value === "resolved" || value === "closed" || value === "ended";
}

function getDisplayStatus(status) {
  return isEndedStatus(status) ? "Ended" : "Active";
}

function getDisplayStatusClass(status) {
  return isEndedStatus(status) ? "ended" : "active";
}

function getChannel(item) {
  const directChannel = String(item?.channel || "").trim().toLowerCase();

  if (["website", "telegram", "facebook"].includes(directChannel)) {
    return directChannel;
  }

  const sourceText = [
    item?.session_id,
    item?.external_chat_id,
    item?.external_user_id,
    item?.source_username,
    item?.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (sourceText.includes("telegram")) return "telegram";
  if (sourceText.includes("facebook")) return "facebook";

  return "website";
}

function getChannelLabel(channel) {
  const value = String(channel || "website").toLowerCase();

  if (value === "telegram") return "Telegram";
  if (value === "facebook") return "Facebook";
  return "Website";
}

function getChannelFullName(channel) {
  const value = String(channel || "website").toLowerCase();

  if (value === "telegram") return "Telegram Bot";
  if (value === "facebook") return "Facebook Messenger";
  return "Website Chatbot";
}

function getSourceText(enquiry) {
  const channel = getChannel(enquiry);

  if (channel === "telegram") {
    if (enquiry?.source_username) {
      return `@${String(enquiry.source_username).replace(/^@/, "")}`;
    }

    return "Telegram user";
  }

  if (channel === "facebook") {
    return "Facebook user";
  }

  return "Website visitor";
}

function FacebookIcon({ size = 18 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 8.5H16V5h-2.2C11.1 5 9.5 6.58 9.5 9.25V11H7v3.5h2.5V21H13v-6.5h2.7L16.2 11H13V9.4c0-.6.28-.9 1.5-.9Z" />
    </svg>
  );
}

function getChannelIcon(channel, size = 18) {
  const value = String(channel || "website").toLowerCase();

  if (value === "telegram") return <SendHorizontal size={size} />;
  if (value === "facebook") return <FacebookIcon size={size} />;
  return <Globe2 size={size} />;
}

function ChannelBadge({ channel }) {
  const value = getChannel({ channel });

  return (
    <span className={`admin-channel-badge admin-channel-${value}`}>
      {getChannelIcon(value, 13)}
      {getChannelLabel(value)}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <em className={`admin-status status-${getDisplayStatusClass(status)}`}>
      {getDisplayStatus(status)}
    </em>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="admin-stat-pill">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function AdminDashboard({ onLogout, onBackToChat }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [channelFilter, setChannelFilter] = useState("all");
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

  const enquiries = inboxData?.enquiries || [];
  const selectedEnquiry = selectedDetail?.enquiry;
  const messages = selectedDetail?.messages || [];
  const recentEnquiries = enquiries.slice(0, 6);

  const activeEnquiries = useMemo(
    () => enquiries.filter((item) => !isEndedStatus(item.status)).length,
    [enquiries]
  );

  const endedEnquiries = useMemo(
    () => enquiries.filter((item) => isEndedStatus(item.status)).length,
    [enquiries]
  );

  const channelCounts = useMemo(
    () => ({
      all: enquiries.length,
      website: enquiries.filter((item) => getChannel(item) === "website").length,
      telegram: enquiries.filter((item) => getChannel(item) === "telegram").length,
      facebook: enquiries.filter((item) => getChannel(item) === "facebook").length,
    }),
    [enquiries]
  );

  const filteredEnquiries = useMemo(() => {
    if (channelFilter === "all") return enquiries;
    return enquiries.filter((item) => getChannel(item) === channelFilter);
  }, [channelFilter, enquiries]);

  const selectedChannel = getChannel(selectedEnquiry);
  const activeChannelName =
    channelFilter === "all" ? "All messages" : getChannelFullName(channelFilter);

  function openChannel(channel) {
    setChannelFilter(channel);
    setActiveSection("messages");

    const firstMatch =
      channel === "all"
        ? enquiries[0]
        : enquiries.find((item) => getChannel(item) === channel);

    if (firstMatch) {
      setSelectedEnquiryId(firstMatch.id);
    } else {
      setSelectedEnquiryId(null);
      setSelectedDetail(null);
    }
  }

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      active: activeSection === "dashboard",
      onClick: () => setActiveSection("dashboard"),
    },
    {
      key: "all",
      label: "Messages",
      icon: <MessageCircle size={20} />,
      count: channelCounts.all,
      active: activeSection === "messages" && channelFilter === "all",
      onClick: () => openChannel("all"),
    },
    {
      key: "website",
      label: "Website",
      icon: <Globe2 size={20} />,
      count: channelCounts.website,
      active: activeSection === "messages" && channelFilter === "website",
      onClick: () => openChannel("website"),
    },
    {
      key: "telegram",
      label: "Telegram",
      icon: <SendHorizontal size={20} />,
      count: channelCounts.telegram,
      active: activeSection === "messages" && channelFilter === "telegram",
      onClick: () => openChannel("telegram"),
    },
    {
      key: "facebook",
      label: "Facebook later",
      icon: <FacebookIcon size={20} />,
      count: channelCounts.facebook,
      active: activeSection === "messages" && channelFilter === "facebook",
      onClick: () => openChannel("facebook"),
    },
  ];

  const selectedEnded = isEndedStatus(selectedEnquiry?.status);

  return (
    <div className="admin-shell admin-minimal-shell">
      <aside className="admin-sidebar admin-minimal-sidebar">
        <button
          type="button"
          className="admin-logo-button"
          onClick={() => setActiveSection("dashboard")}
          title="CamTech Admin"
        >
          <img src={logo} alt="CamTech logo" />
        </button>

        <nav className="admin-icon-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.active ? "active" : ""}
              onClick={item.onClick}
              title={item.label}
            >
              {item.icon}
              {item.count > 0 && <em>{item.count}</em>}
            </button>
          ))}
        </nav>

        <div className="admin-rail-bottom">
          <button type="button" title="Back to Chatbot" onClick={onBackToChat}>
            <Bot size={20} />
          </button>

          <button type="button" title="Settings">
            <Settings size={20} />
          </button>

          <button type="button" title="Logout" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      <main className="admin-app admin-minimal-app">
        <header className="admin-topbar admin-minimal-topbar">
          <div>
            <p>
              {activeSection === "dashboard"
                ? "CamTech Admin"
                : activeChannelName}
            </p>
            <h1>
              {activeSection === "dashboard"
                ? "Admin Dashboard"
                : "Student Messages"}
            </h1>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => loadInbox()}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </header>

        {errorMessage && <div className="admin-alert">{errorMessage}</div>}

        {activeSection === "dashboard" ? (
          <section className="admin-dashboard-view admin-minimal-dashboard">
            <section className="admin-stat-row">
              <StatPill label="Total Chats" value={enquiries.length} />
              <StatPill label="Active" value={activeEnquiries} />
              <StatPill label="Ended" value={endedEnquiries} />
            </section>

            <section className="admin-dashboard-main-card">
              <div className="admin-card-header-simple">
                <div>
                  <p>Recent activity</p>
                  <h2>Latest student chats</h2>
                </div>

                <button type="button" onClick={() => openChannel("all")}>
                  Open messages
                </button>
              </div>

              {isLoadingInbox ? (
                <div className="admin-empty">Loading chats...</div>
              ) : recentEnquiries.length > 0 ? (
                <div className="admin-simple-list">
                  {recentEnquiries.map((item) => {
                    const itemChannel = getChannel(item);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="admin-simple-row"
                        onClick={() => openMessage(item.id)}
                      >
                        <div className="admin-avatar">
                          {getInitials(item.name)}
                        </div>

                        <div className="admin-simple-content">
                          <div>
                            <strong>{item.name || "Student"}</strong>
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                          <p>{item.message || "No message preview."}</p>
                        </div>

                        <div className="admin-simple-meta">
                          <ChannelBadge channel={itemChannel} />
                          <StatusBadge status={item.status} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="admin-empty">No chats yet.</div>
              )}
            </section>
          </section>
        ) : (
          <section className="admin-chat-layout admin-minimal-chat-layout">
            <aside className="admin-inbox admin-minimal-inbox">
              <div className="admin-card-header-simple small">
                <div>
                  <p>{activeChannelName}</p>
                  <h2>Inbox</h2>
                </div>
                <span>
                  {filteredEnquiries.length} chat
                  {filteredEnquiries.length === 1 ? "" : "s"}
                </span>
              </div>

              {isLoadingInbox ? (
                <div className="admin-empty">Loading chats...</div>
              ) : filteredEnquiries.length > 0 ? (
                <div className="admin-inbox-list">
                  {filteredEnquiries.map((item) => {
                    const itemChannel = getChannel(item);

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
                            <ChannelBadge channel={itemChannel} />
                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="admin-empty">
                  No{" "}
                  {channelFilter === "all"
                    ? ""
                    : getChannelLabel(channelFilter)}{" "}
                  chats yet.
                </div>
              )}
            </aside>

            <section className="admin-conversation admin-minimal-conversation">
              {!selectedEnquiryId ? (
                <div className="admin-empty center">
                  Select a chat to view the conversation.
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

                        <div className="admin-profile-tags">
                          <ChannelBadge channel={selectedChannel} />
                          <span>{getSourceText(selectedEnquiry)}</span>
                          <StatusBadge status={selectedEnquiry.status} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="admin-message-thread">
                    {messages.length > 0 ? (
                      messages.map((item) => {
                        const isAdmin = item.sender === "admin";
                        const isSystem = item.sender === "system";

                        return (
                          <div
                            key={item.id}
                            className={`admin-message ${
                              isAdmin
                                ? "admin-message-admin"
                                : isSystem
                                ? "admin-message-system"
                                : "admin-message-student"
                            }`}
                          >
                            <div className="admin-message-bubble">
                              {!isSystem && (
                                <div className="admin-message-head">
                                  <strong>
                                    {isAdmin
                                      ? "CamTech Admin"
                                      : selectedChannel === "telegram"
                                      ? "Telegram Student"
                                      : "Student"}
                                  </strong>
                                  <span>{formatDate(item.created_at)}</span>
                                </div>
                              )}

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
                        selectedEnded
                          ? "This chat has ended."
                          : selectedChannel === "telegram"
                          ? "Reply to Telegram student..."
                          : "Write a reply..."
                      }
                      rows="1"
                      disabled={selectedEnded}
                    />

                    <button
                      type="submit"
                      disabled={isSendingReply || !replyText.trim() || selectedEnded}
                      aria-label="Send message"
                    >
                      {isSendingReply ? "..." : <Send size={20} />}
                    </button>
                  </form>
                </>
              ) : (
                <div className="admin-empty center">
                  Could not load this chat.
                </div>
              )}
            </section>
          </section>
        )}
      </main>
    </div>
  );
}