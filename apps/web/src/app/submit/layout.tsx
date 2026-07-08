export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-[#e8edf2] lg:min-h-[calc(100dvh-5rem)]">
      {children}
    </div>
  );
}
