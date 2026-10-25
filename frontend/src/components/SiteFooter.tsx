import { Link } from 'react-router-dom';

interface SiteFooterProps {
  onOpenCart: () => void;
  onOpenOrders: () => void;
}

export function SiteFooter({ onOpenCart, onOpenOrders }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div>
          <p className="footer-wordmark">NORTHLINE<span>/</span>MOTORS</p>
          <p className="footer-description">A considered collection of vehicles for the next line of motion.</p>
        </div>
        <div>
          <p className="footer-label">Business hours</p>
          <p>Monday–Saturday<br /><span>10:00 AM–7:00 PM</span></p>
          <p className="footer-muted">Sunday · Closed</p>
          <p className="footer-muted">Default hours — update as needed.</p>
        </div>
        <div>
          <p className="footer-label">Contact</p>
          <a href="mailto:suryalakavalli@gmail.com">suryalakavalli@gmail.com</a>
          <a href="tel:+916366582056">+91 6366582056</a>
        </div>
        <div>
          <p className="footer-label">Explore</p>
          <Link to="/">Inventory</Link>
          <button type="button" onClick={onOpenCart}>Cart</button>
          <button type="button" onClick={onOpenOrders}>Order history</button>
        </div>
      </div>
      <div className="site-footer-bottom"><span>Northline Motors</span><span>© {new Date().getFullYear()} · Built for the road ahead</span></div>
    </footer>
  );
}
