import { prisma } from "@/lib/prisma";

export type LogLevel = "INFO" | "SUCCESS" | "WARN" | "ERROR";

export interface LogEntry {
  time: string;
  stage: string;
  level: LogLevel;
  message: string;
  details?: any;
}

/**
 * Persists a structured log entry into the database for an IngestionBatch
 * and outputs formatted color-coded logs to standard output for Docker / Coolify monitoring.
 */
export async function logPipelineEvent(
  batchId: string,
  stage: string,
  message: string,
  level: LogLevel = "INFO",
  details?: any
): Promise<void> {
  const now = new Date();
  const timeStr = now.toISOString();
  const timeDisplay = now.toLocaleTimeString("fa-IR");

  // Output to standard console for Docker logs
  const icon = level === "ERROR" ? "❌" : level === "WARN" ? "⚠️" : level === "SUCCESS" ? "✅" : "ℹ️";
  const consolePrefix = `[${now.toISOString().substring(11, 19)}] [Batch ${batchId.slice(-6)}] [${stage}] [${level}] ${icon}`;
  
  if (level === "ERROR") {
    console.error(`${consolePrefix} ${message}`, details ? JSON.stringify(details) : "");
  } else if (level === "WARN") {
    console.warn(`${consolePrefix} ${message}`, details ? JSON.stringify(details) : "");
  } else {
    console.log(`${consolePrefix} ${message}`, details ? JSON.stringify(details) : "");
  }

  // Format string for terminal display in UI
  const logDisplayLine = `[${timeDisplay}] [${stage.toUpperCase()}] ${icon} ${message}${
    details && typeof details === "string" ? ` (${details})` : ""
  }`;

  try {
    const current = await prisma.ingestionBatch.findUnique({
      where: { id: batchId },
      select: { logs: true }
    });

    let existingLogs: string[] = [];
    if (current?.logs) {
      try {
        const parsed = JSON.parse(current.logs);
        if (Array.isArray(parsed)) {
          existingLogs = parsed.map((item) => {
            if (typeof item === "string") return item;
            if (item && item.message) {
              const itemTime = item.time ? new Date(item.time).toLocaleTimeString("fa-IR") : timeDisplay;
              return `[${itemTime}] [${item.stage || "PIPELINE"}] ${item.message}`;
            }
            return JSON.stringify(item);
          });
        }
      } catch (e) {
        existingLogs = [current.logs];
      }
    }

    existingLogs.push(logDisplayLine);

    // Keep the most recent 120 log entries to prevent excessive DB record size
    if (existingLogs.length > 120) {
      existingLogs = existingLogs.slice(-120);
    }

    await prisma.ingestionBatch.update({
      where: { id: batchId },
      data: {
        logs: JSON.stringify(existingLogs)
      }
    });
  } catch (err: any) {
    console.error(`[logPipelineEvent] Failed to persist log to DB for batch ${batchId}:`, err.message);
  }
}
