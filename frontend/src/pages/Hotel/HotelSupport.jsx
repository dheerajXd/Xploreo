// Hotel partners reuse the Traveller Support Tickets page (same UI + ticket components); the
// shared navbar is already rendered by HotelLayout, so the page's own navbar is turned off.
import { useAuth } from '@/foundation';
import TravellerSupportTicketsPage from '@/pages/Traveller/TravellerSupportTicketsPage.jsx';

export default function HotelSupport() {
  const { user } = useAuth();
  return <TravellerSupportTicketsPage user={user} showNavbar={false} />;
}
