import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', color }) => {
  // Safe lookup in Lucide icons
  const IconComponent = (LucideIcons as Record<string, any>)[name] || LucideIcons.Tag;

  return <IconComponent className={className} style={color ? { color } : undefined} />;
};
