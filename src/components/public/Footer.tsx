export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-lg font-semibold text-white mb-2">PlayHard 劇本殺</p>
        <p className="text-sm">提供最優質的劇本殺體驗</p>
        <p className="text-sm mt-4">&copy; {new Date().getFullYear()} PlayHard. 版權所有。</p>
      </div>
    </footer>
  );
}
