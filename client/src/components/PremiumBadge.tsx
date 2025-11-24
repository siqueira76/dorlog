import { Badge } from '@/components/ui/badge';
import { Crown, Clock } from 'lucide-react';

interface PremiumBadgeProps {
  variant?: 'premium' | 'trial' | 'free';
  showIcon?: boolean;
  className?: string;
}

export function PremiumBadge({ variant = 'premium', showIcon = true, className = '' }: PremiumBadgeProps) {
  if (variant === 'free') {
    return null; // Não mostra badge para Free
  }

  const badgeConfig = {
    premium: {
      className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0',
      icon: Crown,
      text: 'Premium',
    },
    trial: {
      className: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0',
      icon: Clock,
      text: 'Trial Premium',
    },
  };

  const config = badgeConfig[variant];
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} ${className}`} data-testid={`badge-${variant}`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.text}
    </Badge>
  );
}
