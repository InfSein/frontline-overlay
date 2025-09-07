import fs from "fs"
import path from "path"
import { marked } from "marked"

export default function ChangelogPage() {
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md")
  const fileContent = fs.readFileSync(changelogPath, "utf-8")
  const html = marked(fileContent)

  return (
    <div className="prose px-6 py-10 max-w-4xl mx-auto space-y-4 select-text">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}