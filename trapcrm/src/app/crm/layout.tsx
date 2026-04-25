import { Sidebar } from './components/Sidebar';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen">{children}</main>
    </div>
  );
}
