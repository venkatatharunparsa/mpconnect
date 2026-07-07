import { readFile } from "fs/promises";
import Link from "next/link";
import { join } from "path";
import { notFound } from "next/navigation";

export default async function DocPage({ params }: { params: { slug: string[] } }) {
  const filename = params.slug.join("/");
  if (!filename.endsWith(".md") || filename.includes("..")) notFound();

  let content: string;
  try {
    content = await readFile(join(process.cwd(), "docs", filename), "utf-8");
  } catch {
    notFound();
  }

  return (
    <article className="py-8">
      <Link href="/docs" className="text-sm text-primary underline">
        ← All documents
      </Link>
      <h1 className="mt-4 font-mono text-lg font-bold text-slate-800">{filename}</h1>
      <pre className="mt-6 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-800">
        {content}
      </pre>
    </article>
  );
}
