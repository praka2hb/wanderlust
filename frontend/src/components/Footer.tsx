export const Footer = () => {
  const currentYear = new Date().getFullYear();


  return (
    <footer className="bg-lime-50 text-white pt-8 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="pt-8 border-t border-slate-700 text-slate-400 text-sm text-center">
          <p>© {currentYear} WanderLust. All rights reserved.</p>
          <p className="mt-2">Made with ❤️ for travelers worldwide</p>
        </div>
      </div>
    </footer>
  );
};