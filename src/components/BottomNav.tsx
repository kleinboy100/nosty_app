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

  // Hide bottom nav entirely for restaurant owners
  if (isOwner) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { to: '/', icon: Home, label: 'Home', show: true },
    { to: '/orders', icon: ClipboardList, label: 'Orders', show: !!user },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', show: true, badge: itemCount },
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More Menu Panel */}
      <div 
        className={cn(
          "fixed bottom-[56px] left-4 right-4 z-50 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl transition-all duration-300 md:hidden",
          moreOpen 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-foreground">More Options</h3>
            <button 
              onClick={() => setMoreOpen(false)}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
          {moreItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                isActive(item.to) 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                isActive(item.to) ? "bg-primary/10" : "bg-muted"
              )}>
                <item.icon size={18} />
              </div>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 md:hidden safe-area-inset-bottom">
        <div className="flex items-center justify-around h-[52px] px-2">
          {visibleItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 relative transition-all duration-200",
                isActive(item.to) 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative p-1 rounded-lg transition-all duration-200",
                isActive(item.to) && "bg-primary/10"
              )}>
                <item.icon size={16} className={cn(
                  "transition-transform duration-200",
                  isActive(item.to) && "scale-110"
                )} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] rounded-full h-3.5 w-3.5 flex items-center justify-center font-bold shadow-md">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] mt-0.5 font-medium transition-all duration-200",
                isActive(item.to) && "font-semibold"
              )}>{item.label}</span>
            </Link>
          ))}
          
          {/* More Button - Only show when not logged in */}
          {!user && (
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 relative transition-all duration-200",
                moreOpen
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-all duration-200",
                moreOpen && "bg-primary/10"
              )}>
                <MoreHorizontal size={16} className={cn(
                  "transition-transform duration-200",
                  moreOpen && "rotate-90"
                )} />
              </div>
              <span className="text-[9px] mt-0.5 font-medium">More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
