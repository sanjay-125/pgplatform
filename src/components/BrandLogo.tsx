import React from 'react';
import brandIcon from '../assets/icon-transparent.png';

interface BrandLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  subtitle?: string;
  subtitleClassName?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'flex items-center gap-2.5',
  iconClassName = 'w-8 h-8 rounded-lg object-contain shadow-xs shrink-0',
  textClassName = 'font-extrabold text-slate-900 tracking-tight text-base',
  showText = true,
  subtitle,
  subtitleClassName = 'text-[10px] text-slate-400 font-semibold tracking-wider uppercase block',
}) => {
  return (
    <div className={`select-none ${className}`}>
      <img
        src={brandIcon}
        alt="StayDesk"
        className={iconClassName}
      />
      {showText && (
        <div className="min-w-0">
          <span className={textClassName}>StayDesk</span>
          {subtitle && (
            <span className={subtitleClassName}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
