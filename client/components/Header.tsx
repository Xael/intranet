
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-white border-b">
      <h1 className="text-2xl font-semibold text-gray-800">Plataforma de Gestão</h1>
      {/* Additional header content can go here, e.g., user menu, notifications */}
    </header>
  );
};

export default Header;