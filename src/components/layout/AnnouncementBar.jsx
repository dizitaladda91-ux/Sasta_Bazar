import React from 'react';
import { useStorefrontContent } from '../../hooks/useStorefrontContent';

export default function AnnouncementBar() {
  const { content } = useStorefrontContent('home_copy');

  return (
    <div className="min-h-10 bg-[#e9d7c4] px-4 py-2 text-center text-[11px] font-medium tracking-[0.08em] text-[#253044] sm:text-xs">
      {content?.announcement || null}
    </div>
  );
}
