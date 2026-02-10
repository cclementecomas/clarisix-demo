export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-8">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <img src="/Clarisix_Logo_HD.svg" alt="Clarisix" className="h-[120px] object-contain" />
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
