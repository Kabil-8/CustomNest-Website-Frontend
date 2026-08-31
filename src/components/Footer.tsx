import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { StitchDivider } from './ui';
import { InstagramIcon, FacebookIcon } from './SocialIcons';

export function Footer() {
  return (
    <footer className="bg-ivory border-t border-line mt-20">
      <div className="container-nest py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Link to="/" className="font-display text-xl">
              TheCustom<span className="text-rose-500">Nest</span>
            </Link>
            <p className="text-sm text-muted mt-3 max-w-xs leading-relaxed">
              Thoughtfully handmade crochet pieces — bouquets, amigurumi, keychains, and made-to-order gifts.
              Made by hand, made for you.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://www.instagram.com/the_customnest_/" target="_blank" rel="noopener noreferrer" aria-label="TheCustomNest on Instagram" className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-colors">
                <InstagramIcon size={16} />
              </a>
              <a href="#" aria-label="TheCustomNest on Facebook" className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-colors">
                <FacebookIcon size={16} />
              </a>
            </div>
          </div>

          <FooterColumn
            title="Shop"
            links={[
              { label: 'All Products', to: '/shop' },
              { label: 'New Arrivals', to: '/shop?sort=newest' },
              { label: 'Best Sellers', to: '/shop?sort=popular' },
              { label: 'Custom Orders', to: '/custom-order' },
            ]}
          />
          <FooterColumn
            title="Help"
            links={[
              { label: 'Contact Us', to: '/contact' },
              { label: 'FAQ', to: '/faq' },
              { label: 'Order Tracking', to: '/account/orders' },
            ]}
          />
          <FooterColumn
            title="Account"
            links={[
              { label: 'Sign In', to: '/login' },
              { label: 'Create Account', to: '/register' },
              { label: 'My Orders', to: '/account/orders' },
              { label: 'Wishlist', to: '/account/wishlist' },
            ]}
          />
        </div>

        <StitchDivider className="my-10" width={120} />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <p>© {new Date().getFullYear()} TheCustomNest. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="mailto:hello@thecustomnest.com" className="flex items-center gap-1.5 hover:text-rose-600">
              <Mail size={14} /> hello@thecustomnest.com
            </a>
            <a href="tel:+910000000000" className="flex items-center gap-1.5 hover:text-rose-600">
              <Phone size={14} /> +91 00000 00000
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal mb-4">{title}</h4>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-muted hover:text-rose-600 transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
