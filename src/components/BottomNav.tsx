import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Store, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export function BottomNav() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { to: '/', icon: Home, label: 'Home', show: true },
    { to: '/orders', icon: ClipboardList, label: 'Orders', show: !!user },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', show: true, badge: itemCount },
    { to: '/restaurant/dashboard', icon: Store, label: 'Dashboard', show: !!user },
    { to: user ? '/profile' : '/auth', icon: User, label: user ? 'Profile' : 'Sign In', show: true },
  ];

  const visibleItems = navItems.filter(item => item.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center flex-1 py-2 relative transition-colors ${
              isActive(item.to) 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
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
      </div>
    </nav>
  );
}
