export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[calc(100dvh-3.5rem-4rem)] flex-col py-4 lg:min-h-[calc(100dvh-4rem)]">{children}</div>;
}
