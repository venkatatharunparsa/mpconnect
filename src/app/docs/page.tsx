import { readdir } from "fs/promises";
import Link from "next/link";
import { join } from "path";

export default async function DocsIndexPage() {
  const files = (await readdir(join(process.cwd(), "docs")))
    .filter((f) => f.endsWith(".md"))
    .sort();

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold text-primary">Research &amp; design documents</h1>
      <p className="mt-2 text-slate-600">
        {files.length} documents — the ground truth behind MPconnect.
      </p>
      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {files.map((file) => (
          <li key={file}>
            <Link
              href={`/docs/${file}`}
              className="block px-4 py-3 text-sm font-mono text-primary hover:bg-slate-50"
            >
              {file}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
