import { NextResponse } from "next/server";
import knowledgeBase from "@/data/yura-knowledge.json";

export async function GET() {
  return NextResponse.json(knowledgeBase);
}
