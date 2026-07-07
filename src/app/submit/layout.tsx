export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 top-14 flex flex-col bg-[#e8edf2]">
      {children}
    </div>
  );
}
