"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Hello World" },
  { href: "/captions", label: "Captions List" },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="side-nav">
      <div className="side-nav__title">Anya's Crack'd</div>
      <div className="side-nav__links">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`side-nav__link${isActive ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
