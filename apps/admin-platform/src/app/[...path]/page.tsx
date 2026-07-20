import { AdminApp, type Section } from "@/components/AdminApp";
const sections=new Set(["dashboard","campaigns","tasks","review","payouts","users","guide","admins","audit","settings"]);
export default async function Page({params}:{params:Promise<{path:string[]}>}){const {path}=await params;const key=sections.has(path[0])?path[0]:"dashboard";return <AdminApp section={key as Section}/>}
