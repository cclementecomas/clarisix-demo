export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-20">
      <div className="relative max-w-[1440px] mx-auto px-6 py-8">
        {/* Zix — our character, sitting on the footer's top line, above the nav. Future Clarisix AI agent. */}
        <div className="group absolute -top-[76px] right-16 z-20">
          {/* speech bubble — opens to the left on hover */}
          <div className="pointer-events-none absolute right-full mr-3 top-1 w-[248px] opacity-0 translate-x-1 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 origin-right">
            <div className="relative bg-gray-900 text-white text-[11px] leading-relaxed rounded-xl px-3.5 py-2.5 shadow-xl">
              <span className="font-semibold text-cx-300">Hi, I’m Zix 👋</span> Soon I’ll be your Clarisix AI agent — watching every metric, surfacing what matters, and taking action for you across the platform.
              <span className="absolute left-full top-3.5 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[6px] border-transparent border-l-gray-900" />
            </div>
          </div>
          <img
            src="/zix-sitting.png"
            alt="Zix — the future Clarisix AI agent"
            draggable={false}
            className="h-[112px] w-auto object-contain select-none cursor-help drop-shadow-md transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <div className="flex items-center justify-between">
          <img src="/clarisix-logo-orange-tm-transparent.png" alt="Clarisix" className="h-[120px] object-contain" />
          <nav className="flex items-center gap-6">
            <a href="#" className="text-sm text-gray-500 hover:text-cx-500 transition-colors">Home</a>
            <a href="#" className="text-sm text-gray-500 hover:text-cx-500 transition-colors">About</a>
            <a href="#" className="text-sm text-gray-500 hover:text-cx-500 transition-colors">Contact</a>
          </nav>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">&copy; 2026 Clarisix. All rights reserved.</p>
          <p className="text-xs text-gray-400">Commerce Performance Management</p>
        </div>
      </div>
    </footer>
  );
}
