import Link from 'next/link';

const NAV = [
  { href: '/crm',           label: 'Dashboard', icon: '◇' },
  { href: '/crm/contacts',  label: 'Contacts',  icon: '◉' },
  { href: '/crm/companies', label: 'Companies', icon: '▣' },
  { href: '/crm/deals',     label: 'Deals',     icon: '◆' },
  { href: '/crm/assets',    label: 'Assets',    icon: '⊞' },
  { href: '/crm/templates', label: 'Templates', icon: '▤' },
];

export function Sidebar() {
  return (
    <aside className="w-56 border-r border-line bg-surface p-4 flex flex-col gap-1 sticky top-0 h-screen">
      <Link href="/crm" className="px-3 py-3 mb-4 flex items-center gap-2">
        <span className="text-cyan text-xl">▶</span>
        <span className="font-bold tracking-tight">TrapCRM</span>
      </Link>
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className="px-3 py-2 rounded-md text-sub hover:bg-line hover:text-ink transition flex items-center gap-2 text-sm"
        >
          <span className="opacity-60">{n.icon}</span>
          <span>{n.label}</span>
        </Link>
      ))}
      <div className="mt-auto px-3 py-2 text-xs text-sub border-t border-line pt-4">
        <div>VPS: 187.77.111.16</div>
        <div className="opacity-50 mt-1">v0.1.0 · local only</div>
      </div>
    </aside>
  );
}
