import React from 'react';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <div className="w-8 h-8 rounded-full animate-color-shift"></div>
          </div>
          <span className="text-xl font-bold">Dynamic NFT App</span>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li><a href="#" className="hover:text-primary-200 transition-colors">Home</a></li>
            <li><a href="#" className="hover:text-primary-200 transition-colors">About</a></li>
            <li><a href="#" className="hover:text-primary-200 transition-colors">Docs</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
