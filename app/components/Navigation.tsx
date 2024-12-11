'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/db', label: 'DB Test' },
    { href: '/test', label: 'AI Test' },
  ];

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex gap-4">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-md ${
              pathname === href
                ? 'bg-gray-900'
                : 'hover:bg-gray-700'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
} 