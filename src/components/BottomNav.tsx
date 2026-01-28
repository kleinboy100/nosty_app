import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, ShoppingCart, MoreHorizontal, User, Store, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useIsRestaurantOwner } from '@/hooks/useIsRestaurantOwner';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { isOwner } = useIsRestaurantOwner();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { to: '/', icon: Home, label: 'Home', show: true },
    { to: '/orders', icon: ClipboardList, label: 'Orders', show: !!user },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', show: true, badge: itemCount },
    // Only show Dashboard to restaurant owners
    { to: '/restaurant/dashboard', icon: Store, label: 'Dashboard', show: !!user && isOwner },
  ];

  const visibleItems = navItems.filter(item => item.show);

  const moreItems = [
    { to: user ? '/profile' : '/auth', icon: User, label: user ? 'Profile' : 'Sign In' },
  ];

  return (
    <>
      {/* More Menu Overlay */}
      {moreOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More Menu Panel */}
      <div 
        className={cn(
          "fixed bottom-16 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl transition-transform duration-300 md:hidden",
          moreOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">More Options</h3>
            <button 
              onClick={() => setMoreOpen(false)}
              className="p-1 rounded-full hover:bg-muted"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>
          {moreItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-colors",
                isActive(item.to) 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted text-foreground"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {visibleItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 relative transition-colors",
                isActive(item.to) 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon size={20} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          ))}
          
          {/* More Button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-2 relative transition-colors",
              moreOpen
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal size={20} />
            <span className="text-xs mt-1 font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
