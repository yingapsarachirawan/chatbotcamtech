import logo from "../assets/logo.jpg";

export default function EmptyState() {
  return (
    <div className="empty-state minimal-empty-state">
      <div className="minimal-hero">
        <div className="minimal-hero-logo">
          <img src={logo} alt="CamTech logo" />
        </div>

        <h1>Hi, I’m a CamTecher</h1>

        <p>
          Hello my future CamTecher!
          <br />
          I’m here to assist you
        </p>
      </div>
    </div>
  );
}