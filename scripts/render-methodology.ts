import * as fs from "fs";
import * as path from "path";
import { CONFIG } from "../src/server/config";

const OUTPUT_PATH = path.join(__dirname, "..", "docs", "ranking-methodology.md");

function generateMarkdown(): string {
  const weights = CONFIG.rank.weights;

  return `# MPConnect Priority Ranking Methodology

> [!NOTE]
> This document is dynamically generated from the active code configuration (\`src/lib/config.ts\`). This prevents documentation drift and ensures total transparency for administrators, citizens, and public officials.

The priority ranking system evaluates master demands to ensure limited government resources (like MPLADS funding and administrative attention) are directed where they are needed most. 

## Active Priority Weights

The overall **Rank Score** is a weighted sum of five key component scores (each normalized between \`0.0\` and \`1.0\`):

| Component | Description | Weight |
| --- | --- | --- |
| **Affected** | Scale of public support (log-scaled count of unique citizens) | **${(weights.affected * 100).toFixed(0)}%** (\`${weights.affected}\`) |
| **Urgency** | Critical nature of the issue (safety, high, medium, low) | **${(weights.urgency * 100).toFixed(0)}%** (\`${weights.urgency}\`) |
| **Recurrence** | History of false closures or recurring problems | **${(weights.recurrence * 100).toFixed(0)}%** (\`${weights.recurrence}\`) |
| **Equity** | Demographics or ward-level equity factors | **${(weights.equity * 100).toFixed(0)}%** (\`${weights.equity}\`) |
| **Data Gap** | Verified public infrastructure deficits | **${(weights.dataGap * 100).toFixed(0)}%** (\`${weights.dataGap}\`) |

**Priority Formula:**
$$\\text{Rank Score} = (\\text{Affected} \\times ${weights.affected}) + (\\text{Urgency} \\times ${weights.urgency}) + (\\text{Recurrence} \\times ${weights.recurrence}) + (\\text{Equity} \\times ${weights.equity}) + (\\text{Data Gap} \\times ${weights.dataGap})$$

---

## Component Details

### 1. Affected Score (${(weights.affected * 100).toFixed(0)}%)
Log-scaled and normalized count of unique reporter keys (citizen identifiers). Single-reporter issues start with a score of \`0.1\`. Larger counts scale logarithmically up to a cap of 50 reporters:
- $S_{\\text{affected}} = \\min\\left(1.0, \\frac{\\ln(\\text{count})}{\\ln(50)}\\right)$ (for count > 1)

### 2. Urgency Score (${(weights.urgency * 100).toFixed(0)}%)
Direct categorization of the issue's severity:
- **Safety Hazards** (e.g., live hanging wire, sewage leaks): \`1.0\`
- **High** (e.g., major road block, active flooding): \`0.7\`
- **Medium** (e.g., streetlights down, garbage piles): \`0.4\`
- **Low** (e.g., playground cosmetic requests): \`0.2\`

### 3. Recurrence Score (${(weights.recurrence * 100).toFixed(0)}%)
Tracks recurring issues and penalizes false closures by administrative authorities. Each false closure count increases this score:
- $S_{\\text{recurrence}} = \\min(1.0, \\text{falseClosureCount} \\times 0.5)$

### 4. Equity Score (${(weights.equity * 100).toFixed(0)}%)
Ward-level demographic equity score. Currently stubbed to \`0.0\` for pilot wards.

### 5. Data Gap Score (${(weights.dataGap * 100).toFixed(0)}%)
Computes infrastructure deficits based on public datasets. For example, in **School Upgrades**, it compares the student-to-classroom ratio against the statutory Right to Education (RTE) norm of **30 students per classroom**:
- $\\text{Deficit Ratio} = \\frac{\\text{Enrollment}}{\\text{Classrooms}}$
- $S_{\\text{dataGap}} = \\min\\left(1.0, \\frac{\\text{Deficit Ratio} - 30}{100}\\right)$ (for ratios > 30)

---
*Watermark: Generated automatically on ${new Date().toISOString().split("T")[0]}.*
`;
}

function main() {
  console.log("Generating methodology document...");
  const markdown = generateMarkdown();
  
  // Ensure docs folder exists
  const docsDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, markdown, "utf-8");
  console.log(`Successfully wrote methodology to ${OUTPUT_PATH}`);
}

main();
