import {createClient} from "@supabase/supabase-js";
import type {NextRequest} from "next/server";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const service=process.env.SUPABASE_SERVICE_ROLE_KEY;

export function adminClient(){
 if(!url||!service) throw new Error("Supabase server environment is incomplete");
 return createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function requireAdmin(req:NextRequest, superOnly=false){
 if(!url||!anon) throw new Error("Supabase authentication environment is incomplete");
 const token=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
 if(!token) return null;
 const verifier=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await verifier.auth.getUser(token);
 if(error||!user) return null;
 const db=adminClient();
 const {data:admin}=await db.from("admin_users").select("id,user_id,role,disabled_at").eq("user_id",user.id).is("disabled_at",null).maybeSingle();
 if(!admin || (superOnly&&admin.role!=="super_admin")) return null;
 return {user,admin,db};
}
export async function audit(db:any,actor:string,action:string,targetType:string,targetId?:string,details:Record<string,unknown>={}){
 await db.from("audit_log").insert({actor_id:actor,action,target_type:targetType,target_id:targetId||null,details});
}