/**
 * Agent Step 5: Knowledge Base Retrieval
 * Searches internal runbook repository for matching IT incident patterns
 * and extracts validated troubleshooting recommendations and dry-run commands.
 */

import { KNOWLEDGE_BASE } from "../kb/knowledgeBase.js";

export function retrieveKnowledgeBase(classification, correlation) {
  const { primaryCategory } = classification;
  const { initiatingEvent } = correlation;

  const targetText = [
    initiatingEvent?.message || "",
    initiatingEvent?.raw || "",
    primaryCategory,
    classification.patterns.map((p) => p.signature).join(" ")
  ].join(" ");

  const scoredEntries = KNOWLEDGE_BASE.map((kb) => {
    let matchScore = 0;

    // Check regex patterns
    kb.patterns.forEach((pattern) => {
      if (pattern.test(targetText)) {
        matchScore += 30;
      }
    });

    // Check category similarity
    if (kb.category.toLowerCase().includes(primaryCategory.toLowerCase().replace(/_/g, " "))) {
      matchScore += 25;
    }

    if (primaryCategory === "DATABASE_ERROR" && kb.id === "KB-DB-001") matchScore += 40;
    if (primaryCategory === "RESOURCE_EXHAUSTION" && kb.id === "KB-RES-003") matchScore += 40;
    if (primaryCategory === "CPU_OVERLOAD" && kb.id === "KB-CPU-004") matchScore += 40;
    if (primaryCategory === "AUTH_SECURITY" && kb.id === "KB-AUTH-005") matchScore += 40;
    if (primaryCategory === "NETWORK_ERROR" && kb.id === "KB-NET-006") matchScore += 40;
    if (primaryCategory === "API_TIMEOUT" && kb.id === "KB-NET-002") matchScore += 40;

    return {
      kb,
      score: matchScore
    };
  });

  scoredEntries.sort((a, b) => b.score - a.score);

  const bestMatch = scoredEntries[0] && scoredEntries[0].score > 0 ? scoredEntries[0].kb : KNOWLEDGE_BASE[0];
  const confidence = scoredEntries[0] ? Math.min(Math.round((scoredEntries[0].score / 80) * 100), 99) : 60;

  return {
    matchedRunbook: bestMatch,
    confidence,
    immediateMitigation: bestMatch.immediateMitigation,
    permanentFix: bestMatch.permanentFix,
    safeDryRunCommands: bestMatch.safeDryRunCommands,
    relatedRunbooks: scoredEntries.slice(1, 3).map((s) => ({
      id: s.kb.id,
      title: s.kb.title,
      category: s.kb.category
    }))
  };
}
