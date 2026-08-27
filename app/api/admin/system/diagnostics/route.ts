import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import fs from "fs";

const execPromise = util.promisify(exec);

export async function GET() {
  const info: Record<string, any> = {};

  try {
    const { stdout: dfOut } = await execPromise("df -h");
    info.disk = dfOut;
  } catch (e: any) { info.disk = e.message; }

  try {
    const { stdout: freeOut } = await execPromise("free -m");
    info.memory = freeOut;
  } catch (e: any) { info.memory = e.message; }

  try {
    const { stdout: zOut } = await execPromise("7z --help | head -n 3");
    info.sevenZip = zOut;
  } catch (e: any) { info.sevenZip = e.message; }

  try {
    const testUrl = "https://dl3.downloadly.ir/Files/Elearning/Udemy_n8n_for_Beginners_Google_Workspace_Automation_with_AI_2026-5_Downloadly.ir.part1.rar";
    const testDest = "/tmp/test_downloadly_header.rar";
    // Download first 2MB to test speed & referer on Iran server
    const { stdout: curlOut, stderr: curlErr } = await execPromise(`curl -L --fail --connect-timeout 10 --max-time 15 --referer "https://downloadly.ir/" -A "Mozilla/5.0" -r 0-2097152 -o "${testDest}" "${testUrl}"`);
    info.curlTest = {
      size: fs.existsSync(testDest) ? fs.statSync(testDest).size : 0,
      stdout: curlOut,
      stderr: curlErr
    };
    if (fs.existsSync(testDest)) fs.unlinkSync(testDest);
  } catch (e: any) {
    info.curlTest = { error: e.message };
  }

  return NextResponse.json(info);
}
