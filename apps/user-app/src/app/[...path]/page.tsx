import { FarmApp, type FarmView } from "@/components/FarmApp";

const allowed = new Set(["farm","work","city","vault","guide","profile","notifications","campaign","task"]);

export default async function CatchAll({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path[0] || "farm";
  return <FarmApp view={(allowed.has(key) ? key : "not-found") as FarmView} detailId={path[1]} />;
}
