import { Utensils } from 'lucide-react';
import { useState } from 'react';

interface DishImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function DishImage({ src, alt, className = '' }: DishImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-950 text-zinc-200 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Utensils className="w-7 h-7 text-orange-400 mb-2" aria-hidden="true" />
        <span className="text-xs font-medium text-zinc-300 line-clamp-2 max-w-[16rem]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      loading="lazy"
    />
  );
}
