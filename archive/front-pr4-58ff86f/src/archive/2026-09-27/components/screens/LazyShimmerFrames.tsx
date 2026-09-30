import React from 'react';

export const Screen1Skeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-[#dcf4fa] p-4 relative select-none animate-pulse overflow-hidden">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Avatar circle */}
          <div className="w-8 h-8 rounded-full bg-[#bdebf5]" />
          <div className="space-y-1.5">
            {/* Short line */}
            <div className="w-24 h-2.5 rounded-full bg-[#bdebf5]" />
            <div className="w-16 h-2 rounded-full bg-[#bdebf5]" />
          </div>
        </div>
        {/* 3 Header action icons */}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-[#bdebf5]" />
          <div className="w-4 h-4 rounded-full bg-[#bdebf5]" />
          <div className="w-4 h-4 rounded-full bg-[#bdebf5]" />
        </div>
      </div>

      {/* Main Content Cards Skeleton */}
      <div className="space-y-4 flex-1">
        {/* Card 1 */}
        <div className="bg-[#c8eef7]/80 rounded-2xl p-4 space-y-2.5">
          <div className="w-3/4 h-3.5 rounded-full bg-[#b2e5f2]" />
          <div className="w-1/2 h-2.5 rounded-full bg-[#b2e5f2]" />
        </div>

        {/* Card 2 */}
        <div className="bg-[#c8eef7]/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-28 h-4 rounded-full bg-[#b2e5f2]" />
            <div className="w-6 h-6 rounded-lg bg-[#b2e5f2]" />
          </div>
          <div className="w-full h-24 rounded-xl bg-[#b2e5f2]/60" />
        </div>

        {/* Card 3 */}
        <div className="bg-[#c8eef7]/80 rounded-2xl p-4 space-y-2">
          <div className="w-2/3 h-3 rounded-full bg-[#b2e5f2]" />
          <div className="w-1/3 h-2.5 rounded-full bg-[#b2e5f2]" />
        </div>
      </div>

      {/* FAB Orange Button (Matching uploaded screenshot exactly!) */}
      <div className="absolute bottom-6 right-5">
        <div className="w-10 h-10 rounded-full bg-[#EC7000] shadow-md flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
};

export const Screen2Skeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-[#dcf4fa] p-4 relative select-none animate-pulse overflow-hidden justify-between">
      {/* Top Header Skeleton Bar */}
      <div className="pt-2">
        <div className="w-40 h-3.5 rounded-full bg-[#bdebf5]" />
      </div>

      {/* Center Action Button (Matching uploaded screenshot with prominent orange pill button) */}
      <div className="my-auto flex flex-col items-center justify-center px-4 w-full">
        <div className="w-full max-w-[260px] h-11 rounded-xl bg-[#EC7000] shadow-md flex items-center justify-center">
          <div className="w-24 h-3 rounded-full bg-white/40" />
        </div>
      </div>

      {/* Bottom Status / Table Rows (Matching uploaded screenshot with 3 horizontal rows & icons) */}
      <div className="space-y-3 pb-4 border-t border-[#bdebf5]/60 pt-4">
        {/* Row 1 */}
        <div className="flex items-center justify-between">
          <div className="w-32 h-2.5 rounded-full bg-[#bdebf5]" />
          <div className="w-3 h-3 rounded-full bg-[#bdebf5]" />
        </div>

        {/* Row 2 */}
        <div className="flex items-center justify-between">
          <div className="w-40 h-2.5 rounded-full bg-[#bdebf5]" />
          <div className="w-3 h-3 rounded-full bg-[#bdebf5]" />
        </div>

        {/* Row 3 */}
        <div className="flex items-center justify-between">
          <div className="w-36 h-2.5 rounded-full bg-[#bdebf5]" />
          <div className="w-3 h-3 rounded-full bg-[#bdebf5]" />
        </div>
      </div>
    </div>
  );
};
