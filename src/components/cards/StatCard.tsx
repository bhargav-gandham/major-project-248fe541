import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'gradient-primary text-primary-foreground';
      case 'accent':
        return 'gradient-accent text-accent-foreground';
      case 'success':
        return 'gradient-success text-success-foreground';
      case 'warning':
        return 'gradient-warning text-warning-foreground';
      case 'danger':
        return 'gradient-danger text-destructive-foreground';
      default:
        return 'bg-card text-card-foreground';
    }
  };

  const getIconBg = () => {
    if (variant !== 'default') return 'bg-white/20';
    switch (variant) {
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <div className={cn(
      "rounded-xl p-6 shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      getVariantStyles()
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium",
            variant === 'default' ? 'text-muted-foreground' : 'text-white/80'
          )}>
            {title}
          </p>
          <p className="text-3xl font-display font-bold mt-2">{value}</p>
          {subtitle && (
            <p className={cn(
              "text-sm mt-1",
              variant === 'default' ? 'text-muted-foreground' : 'text-white/70'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm font-medium",
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">vs last week</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", getIconBg())}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
