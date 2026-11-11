import React from 'react';

export type PixelIconName =
  | 'folder'
  | 'envelope'
  | 'cd'
  | 'CD'
  | 'computer'
  | 'heart'
  | 'smiley'
  | 'star'
  | 'trophy'
  | 'dice'
  | 'cursor'
  | 'clock'
  | 'trash'
  | 'settings'
  | 'snake'
  | 'ladder'
  | 'grid'
  | 'cards'
  | 'plus'
  | 'play'
  | 'pause'
  | 'check'
  | 'close'
  | 'user'
  | 'globe'
  | 'lock'
  | 'sparkle';

interface PixelIconProps {
  name: PixelIconName;
  size?: number;
  className?: string;
  title?: string;
}

export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size = 20,
  className = '',
  title,
}) => {
  const normalized = name === 'CD' ? 'cd' : name;
  const ink = 'var(--px-border, #4A3D8F)';

  const renderIcon = () => {
    switch (normalized) {
      case 'folder':
        return (
          <>
            {/* Back folder tab */}
            <path
              d="M3 6a2 2 0 0 1 2-2h4.5l2 2.5H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"
              fill="#FFE36E"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Document sheet inside */}
            <path
              d="M6 5h9a1 1 0 0 1 1 1v4H6V5z"
              fill="#FFFFFF"
              stroke={ink}
              strokeWidth="1.4"
            />
            <path d="M8 7h5M8 9h3" stroke={ink} strokeWidth="1" strokeLinecap="round" />
            {/* Front folder pocket */}
            <path
              d="M2 9.5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5z"
              fill="#FFF085"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Kawaii sticker badge on folder */}
            <circle cx="16" cy="14" r="2.5" fill="#FF8FA3" stroke={ink} strokeWidth="1.2" />
          </>
        );

      case 'plus':
        return (
          <>
            <path
              d="M10 3.5a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5V9h5.5A1.5 1.5 0 0 1 21 10.5v1a1.5 1.5 0 0 1-1.5 1.5H14v5.5a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5V13H4.5A1.5 1.5 0 0 1 3 11.5v-1A1.5 1.5 0 0 1 4.5 9H10V3.5z"
              fill="#FFE36E"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* White bevel highlight */}
            <path
              d="M11 4.5v5.5H5.5"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );

      case 'envelope':
        return (
          <>
            <rect
              x="2.5"
              y="5"
              width="19"
              height="14"
              rx="2"
              fill="#FFFFFF"
              stroke={ink}
              strokeWidth="1.8"
            />
            {/* Flap lines */}
            <path
              d="M3 6.5l9 6.5 9-6.5"
              fill="none"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Cute pink heart seal */}
            <path
              d="M12 14c-.6-.7-1.6-.6-2 .2-.4-.8-1.4-.9-2-.2-.7.8-.2 1.8.9 2.7l1.1.9 1.1-.9c1.1-.9 1.6-1.9.9-2.7z"
              fill="#FF8FA3"
              stroke={ink}
              strokeWidth="1"
            />
          </>
        );

      case 'cd':
        return (
          <>
            <circle cx="12" cy="12" r="9.5" fill="#A8D4F5" stroke={ink} strokeWidth="1.8" />
            <circle cx="12" cy="12" r="5" fill="#EAE2FF" stroke={ink} strokeWidth="1.3" />
            <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" stroke={ink} strokeWidth="1.5" />
            {/* Iridescent shimmer arcs */}
            <path
              d="M6 7.5a8 8 0 0 1 6-3"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M18 16.5a8 8 0 0 1-6 3"
              stroke="#FF8FA3"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );

      case 'computer':
        return (
          <>
            {/* Beveled monitor case */}
            <rect
              x="2.5"
              y="3"
              width="19"
              height="14"
              rx="2"
              fill="#F4F0FF"
              stroke={ink}
              strokeWidth="1.8"
            />
            {/* Screen */}
            <rect
              x="4.5"
              y="5"
              width="15"
              height="10"
              rx="1"
              fill="#A8D4F5"
              stroke={ink}
              strokeWidth="1.3"
            />
            {/* Smiley or heart on screen */}
            <circle cx="9.5" cy="9.5" r="1" fill={ink} />
            <circle cx="14.5" cy="9.5" r="1" fill={ink} />
            <path d="M10.5 12c.7.8 2.3.8 3 0" stroke={ink} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Monitor stand */}
            <path
              d="M9 17h6v2h3a1 1 0 0 1 1 1v1H5v-1a1 1 0 0 1 1-1h3v-2z"
              fill="#FFE36E"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </>
        );

      case 'heart':
        return (
          <>
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="#FF8FA3"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Cute highlight bean on top-left */}
            <ellipse
              cx="7.5"
              cy="7.5"
              rx="2.2"
              ry="1.2"
              transform="rotate(-30 7.5 7.5)"
              fill="#FFFFFF"
            />
          </>
        );

      case 'smiley':
        return (
          <>
            <circle cx="12" cy="12" r="9.5" fill="#FFE36E" stroke={ink} strokeWidth="1.8" />
            {/* Crescent happy eyes */}
            <path
              d="M7 9.5c.5-1 1.5-1.5 2.5-1.5s2 .5 2.5 1.5"
              stroke={ink}
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M12 9.5c.5-1 1.5-1.5 2.5-1.5s2 .5 2.5 1.5"
              stroke={ink}
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Big happy smile */}
            <path
              d="M8.5 13.5c.8 2 2.2 2.8 3.5 2.8s2.7-.8 3.5-2.8"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Blush cheeks */}
            <circle cx="6.5" cy="13" r="1.5" fill="#FF9AA2" />
            <circle cx="17.5" cy="13" r="1.5" fill="#FF9AA2" />
          </>
        );

      case 'star':
        return (
          <>
            <path
              d="M12 2l2.9 6.2 6.8.8-5 4.8 1.3 6.7-6-3.3-6 3.3 1.3-6.7-5-4.8 6.8-.8L12 2z"
              fill="#FFE36E"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Highlight */}
            <polygon points="12,5 13,8 11.5,8" fill="#FFFFFF" />
          </>
        );

      case 'trophy':
        return (
          <>
            {/* Cup */}
            <path
              d="M6 3h12v6c0 3.3-2.7 6-6 6s-6-2.7-6-6V3z"
              fill="#FFE36E"
              stroke={ink}
              strokeWidth="1.8"
            />
            {/* Handles */}
            <path
              d="M6 5H4a2.5 2.5 0 0 0-2.5 2.5v.5A3 3 0 0 0 4.5 11H6"
              fill="none"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M18 5h2a2.5 2.5 0 0 1 2.5 2.5v.5a3 3 0 0 1-3 3H18"
              fill="none"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Stem & Base */}
            <path
              d="M10 15h4v3h2.5a1 1 0 0 1 1 1v2H6.5v-2a1 1 0 0 1 1-1H10v-3z"
              fill="#F8C4DC"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Center Star on Cup */}
            <polygon points="12,6.5 12.8,8.2 14.6,8.4 13.3,9.7 13.6,11.5 12,10.6 10.4,11.5 10.7,9.7 9.4,8.4 11.2,8.2" fill="#FFFFFF" stroke={ink} strokeWidth="0.8" />
          </>
        );

      case 'dice':
        return (
          <>
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="3.5"
              fill="#FFFFFF"
              stroke={ink}
              strokeWidth="1.8"
            />
            {/* Dots (5-die) */}
            <circle cx="7.5" cy="7.5" r="1.6" fill={ink} />
            <circle cx="16.5" cy="7.5" r="1.6" fill={ink} />
            <circle cx="12" cy="12" r="1.8" fill="#FF8FA3" stroke={ink} strokeWidth="0.8" />
            <circle cx="7.5" cy="16.5" r="1.6" fill={ink} />
            <circle cx="16.5" cy="16.5" r="1.6" fill={ink} />
          </>
        );

      case 'cursor':
        return (
          <>
            <path
              d="M4 3l7 17 2.8-6.5L20 11 4 3z"
              fill="#FFFFFF"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M7 6l4.5 11 1.8-4.2 4.2-1.8L7 6z" fill="#FFE36E" />
          </>
        );

      case 'clock':
        return (
          <>
            <circle cx="12" cy="12" r="9.5" fill="#FFFFFF" stroke={ink} strokeWidth="1.8" />
            {/* 4 tick dots */}
            <circle cx="12" cy="5" r="0.9" fill={ink} />
            <circle cx="19" cy="12" r="0.9" fill={ink} />
            <circle cx="12" cy="19" r="0.9" fill={ink} />
            <circle cx="5" cy="12" r="0.9" fill={ink} />
            {/* Hands */}
            <line x1="12" y1="12" x2="12" y2="7.5" stroke={ink} strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="12" x2="15.8" y2="12" stroke={ink} strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.6" fill="#FF8FA3" />
          </>
        );

      case 'trash':
        return (
          <>
            {/* Lid */}
            <path
              d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
              fill="#FFE36E"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Bin Body */}
            <path
              d="M5 6.5l1.2 13a2 2 0 0 0 2 1.8h7.6a2 2 0 0 0 2-1.8L19 6.5"
              fill="#FF9AA2"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Vertical Ribs */}
            <line x1="10" y1="10" x2="10.2" y2="17" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
            <line x1="14" y1="10" x2="13.8" y2="17" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
          </>
        );

      case 'settings':
        return (
          <>
            {/* 8-tooth gear */}
            <path
              d="M10 2h4l.8 2.5a8 8 0 0 1 2.2 1l2.3-1.2 2.8 2.8-1.2 2.3c.4.7.7 1.5 1 2.2L22 10v4l-2.5.8a8 8 0 0 1-1 2.2l1.2 2.3-2.8 2.8-2.3-1.2a8 8 0 0 1-2.2 1L14 22h-4l-.8-2.5a8 8 0 0 1-2.2-1l-2.3 1.2-2.8-2.8 1.2-2.3a8 8 0 0 1-1-2.2L2 14v-4l2.5-.8a8 8 0 0 1 1-2.2l-1.2-2.3 2.8-2.8 2.3 1.2a8 8 0 0 1 2.2-1L10 2z"
              fill="#A8D4F5"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3.2" fill="#FFE36E" stroke={ink} strokeWidth="1.8" />
          </>
        );

      case 'snake':
        return (
          <>
            {/* Charming green coiled snake body */}
            <path
              d="M17.5 7c-1-2-3.5-2.5-5.5-1.5-2.5 1.2-4 3.5-6 4.5S2 10.5 2 13s2 4.5 4.5 4.5 4-1.5 5.5-3 2.5-3.5 4.5-3.5 3.5 1 4 2.5"
              fill="none"
              stroke="#8CE9B8"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17.5 7c-1-2-3.5-2.5-5.5-1.5-2.5 1.2-4 3.5-6 4.5S2 10.5 2 13s2 4.5 4.5 4.5 4-1.5 5.5-3 2.5-3.5 4.5-3.5 3.5 1 4 2.5"
              fill="none"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Cute snake head */}
            <circle cx="18" cy="6.5" r="3" fill="#8CE9B8" stroke={ink} strokeWidth="1.6" />
            <circle cx="18.8" cy="5.8" r="0.8" fill={ink} />
            {/* Tiny pink tongue */}
            <path d="M20.5 6.5h2l.8-.8m-.8 1.6l.8-.8" stroke="#FF8FA3" strokeWidth="1.2" strokeLinecap="round" />
          </>
        );

      case 'ladder':
        return (
          <>
            {/* Left & Right Rails */}
            <line x1="6.5" y1="2" x2="6.5" y2="22" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="17.5" y1="2" x2="17.5" y2="22" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
            {/* Inner Rails */}
            <line x1="6.5" y1="3" x2="6.5" y2="21" stroke="#FFE36E" strokeWidth="1.3" strokeLinecap="round" />
            <line x1="17.5" y1="3" x2="17.5" y2="21" stroke="#FFE36E" strokeWidth="1.3" strokeLinecap="round" />
            {/* 4 Rungs */}
            <line x1="6.5" y1="6" x2="17.5" y2="6" stroke={ink} strokeWidth="2" strokeLinecap="round" />
            <line x1="6.5" y1="11" x2="17.5" y2="11" stroke={ink} strokeWidth="2" strokeLinecap="round" />
            <line x1="6.5" y1="16" x2="17.5" y2="16" stroke={ink} strokeWidth="2" strokeLinecap="round" />
            <line x1="6.5" y1="20" x2="17.5" y2="20" stroke={ink} strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'grid':
        return (
          <>
            <rect
              x="2.5"
              y="2.5"
              width="19"
              height="19"
              rx="2.5"
              fill="#FFFFFF"
              stroke={ink}
              strokeWidth="1.8"
            />
            {/* Grid Dividers */}
            <line x1="8.8" y1="2.5" x2="8.8" y2="21.5" stroke={ink} strokeWidth="1.6" />
            <line x1="15.2" y1="2.5" x2="15.2" y2="21.5" stroke={ink} strokeWidth="1.6" />
            <line x1="2.5" y1="8.8" x2="21.5" y2="8.8" stroke={ink} strokeWidth="1.6" />
            <line x1="2.5" y1="15.2" x2="21.5" y2="15.2" stroke={ink} strokeWidth="1.6" />
            {/* Center Star Cell */}
            <rect x="9.2" y="9.2" width="5.6" height="5.6" fill="#FFE36E" />
            <polygon points="12,10 12.6,11.2 13.9,11.4 13,12.3 13.2,13.6 12,13 10.8,13.6 11,12.3 10.1,11.4 11.4,11.2" fill="#FF8FA3" stroke={ink} strokeWidth="0.6" />
          </>
        );

      case 'cards':
        return (
          <>
            {/* Back Card (Angled) */}
            <rect
              x="3.5"
              y="4.5"
              width="12"
              height="16"
              rx="1.8"
              transform="rotate(-12 9.5 12.5)"
              fill="#A8D4F5"
              stroke={ink}
              strokeWidth="1.8"
            />
            {/* Front Card (Upright) */}
            <rect
              x="8.5"
              y="3.5"
              width="12.5"
              height="17"
              rx="2"
              fill="#FFFFFF"
              stroke={ink}
              strokeWidth="1.8"
            />
            {/* Heart symbol on front card */}
            <path
              d="M14.8 10c-.7-.8-1.8-.7-2.3.2-.5-.9-1.6-1-2.3-.2-.8.9-.3 2.1.9 3.2l1.4 1.2 1.4-1.2c1.2-1.1 1.7-2.3.9-3.2z"
              fill="#FF8FA3"
              stroke={ink}
              strokeWidth="0.8"
            />
            {/* Small corner suit */}
            <circle cx="10.5" cy="5.5" r="0.8" fill="#FF8FA3" />
          </>
        );

      case 'play':
        return (
          <path
            d="M6.5 4.5a1.2 1.2 0 0 1 1.8-1l11.5 7a1.2 1.2 0 0 1 0 2l-11.5 7a1.2 1.2 0 0 1-1.8-1V4.5z"
            fill="#A8E6CF"
            stroke={ink}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        );

      case 'pause':
        return (
          <>
            <rect x="5.5" y="3.5" width="4.5" height="17" rx="1.5" fill="#FFE36E" stroke={ink} strokeWidth="1.8" />
            <rect x="14" y="3.5" width="4.5" height="17" rx="1.5" fill="#FFE36E" stroke={ink} strokeWidth="1.8" />
          </>
        );

      case 'check':
        return (
          <path
            d="M4 12.5l5.5 5.5L20 6.5"
            fill="none"
            stroke={ink}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'close':
        return (
          <path
            d="M5.5 5.5l13 13M18.5 5.5l-13 13"
            stroke={ink}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        );

      case 'user':
        return (
          <>
            <circle cx="12" cy="7.5" r="4.5" fill="#FFE36E" stroke={ink} strokeWidth="1.8" />
            {/* Cute eyes */}
            <circle cx="10.5" cy="7.5" r="0.8" fill={ink} />
            <circle cx="13.5" cy="7.5" r="0.8" fill={ink} />
            {/* Body */}
            <path
              d="M4.5 20c0-4 3.5-7 7.5-7s7.5 3 7.5 7"
              fill="#F8C4DC"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </>
        );

      case 'globe':
        return (
          <>
            <circle cx="12" cy="12" r="9.5" fill="#A8D4F5" stroke={ink} strokeWidth="1.8" />
            {/* Lat / Long lines */}
            <ellipse cx="12" cy="12" rx="4.8" ry="9.5" fill="none" stroke={ink} strokeWidth="1.5" />
            <line x1="2.5" y1="12" x2="21.5" y2="12" stroke={ink} strokeWidth="1.5" />
            {/* Continent patches */}
            <circle cx="12" cy="7.5" r="1.5" fill="#8CE9B8" />
            <circle cx="15.5" cy="14" r="1.8" fill="#8CE9B8" />
          </>
        );

      case 'lock':
        return (
          <>
            {/* Shackle */}
            <path
              d="M7.5 11V7a4.5 4.5 0 0 1 9 0v4"
              fill="none"
              stroke={ink}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Body */}
            <rect
              x="4.5"
              y="10.5"
              width="15"
              height="11"
              rx="2.5"
              fill="#FFE36E"
              stroke={ink}
              strokeWidth="1.8"
            />
            {/* Keyhole */}
            <circle cx="12" cy="15" r="1.5" fill={ink} />
            <path d="M11.5 15.5l-.6 2.5h2.2l-.6-2.5" fill={ink} />
          </>
        );

      case 'sparkle':
        return (
          <>
            {/* 4-point magic star */}
            <path
              d="M12 2c.6 4.6 4.6 8.6 9.2 9.2-4.6.6-8.6 4.6-9.2 9.2-.6-4.6-4.6-8.6-9.2-9.2 4.6-.6 8.6-4.6 9.2-9.2z"
              fill="#FFE36E"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Bright center & mini twinkle */}
            <circle cx="12" cy="11.2" r="2.2" fill="#FFFFFF" />
            <circle cx="19" cy="5" r="1.2" fill="#FF8FA3" stroke={ink} strokeWidth="0.8" />
            <circle cx="5" cy="17" r="1.2" fill="#A8D4F5" stroke={ink} strokeWidth="0.8" />
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 select-none align-middle ${className}`}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {renderIcon()}
    </svg>
  );
};
