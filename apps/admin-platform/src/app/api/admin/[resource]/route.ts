import {NextRequest,NextResponse} from "next/server";
import {audit,requireAdmin} from "@/lib/admin-server";
export const runtime="nodejs"; export const dynamic="force-dynamic";

const config:Record<string,{table:string;select:string;super?:boolean}>={
 dashboard:{table:"campaigns",select:"id"},
 campaigns:{table:"campaigns",select:"*,tasks(count)"},
 tasks:{table:"tasks",select:"*,campaigns(title)"},
 submissions:{table:"submissions",select:"*,profiles(display_name),tasks(title,reward_cents),submission_notes(note,reference_link)"},
 payouts:{table:"payout_requests",select:"*,profiles(display_name),wallet_addresses(network,address,label)"},
 users:{table:"profiles",select:"*"},
 admins:{table:"admin_users",select:"*",super:true},
 audit:{table:"audit_log",select:"*",super:true},
 settings:{table:"platform_settings",select:"*"},
 youtube:{table:"youtube_connections",select:"*"}
};
function responseError(e:unknown,status=500){return NextResponse.json({error:e instanceof Error?e.message:String(e)},{status});}
export async function GET(req:NextRequest,{params}:{params:Promise<{resource:string}>}){
 try{
  const {resource}=await params; const c=config[resource]; if(!c)return responseError("Unknown resource",404);
  const ctx=await requireAdmin(req,!!c.super); if(!ctx)return responseError("Unauthorized",401);
  if(resource==="dashboard"){
   const [users,tasks,payouts,reviews,campaigns]=await Promise.all([
    ctx.db.from("profiles").select("*",{count:"exact",head:true}),
    ctx.db.from("tasks").select("*",{count:"exact",head:true}).eq("status","published"),
    ctx.db.from("payout_requests").select("*",{count:"exact",head:true}).eq("status","requested"),
    ctx.db.from("submissions").select("*",{count:"exact",head:true}).eq("status","pending").eq("verification_path","manual"),
    ctx.db.from("campaigns").select("id,title,status,tasks(count),submissions:tasks(submissions(count))").order("created_at",{ascending:false}).limit(10)
   ]);
   return NextResponse.json({metrics:{users:users.count||0,tasks:tasks.count||0,payouts:payouts.count||0,reviews:reviews.count||0},campaigns:campaigns.data||[]});
  }
  let q=ctx.db.from(c.table).select(c.select).order(resource==="settings"?"updated_at":"created_at",{ascending:false});
  const {data,error}=await q.limit(250); if(error)throw error; return NextResponse.json(data||[]);
 }catch(e){return responseError(e);}
}
export async function POST(req:NextRequest,{params}:{params:Promise<{resource:string}>}){
 try{
  const {resource}=await params; const c=config[resource]; if(!c)return responseError("Unknown resource",404);
  const ctx=await requireAdmin(req,!!c.super); if(!ctx)return responseError("Unauthorized",401);
  const body=await req.json();
  if(resource==="submissions"&&body.action==="review"){
   const {data,error}=await ctx.db.rpc("review_submission",{target_submission:body.id,decision:body.decision,reason:body.reason||null});
   if(error)throw error; return NextResponse.json(data);
  }
  if(resource==="campaigns")body.created_by=ctx.admin.id;
  if(resource==="admins"){return responseError("Use an administrator invitation flow",400);}
  const {data,error}=await ctx.db.from(c.table).insert(body).select(c.select).single(); if(error)throw error;
  await audit(ctx.db,ctx.admin.id,`${resource}.created`,c.table,data.id);
  return NextResponse.json(data,{status:201});
 }catch(e){return responseError(e);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{resource:string}>}){
 try{
  const {resource}=await params; const c=config[resource]; if(!c)return responseError("Unknown resource",404);
  const ctx=await requireAdmin(req,!!c.super); if(!ctx)return responseError("Unauthorized",401);
  const {id,...changes}=await req.json(); if(!id)return responseError("id is required",400);
  if(resource==="tasks"){
   const {data:old}=await ctx.db.from("tasks").select("*").eq("id",id).single();
   if(old){await ctx.db.from("task_versions").upsert({task_id:id,version:old.current_version,snapshot:old,created_by:ctx.admin.id},{onConflict:"task_id,version"}); changes.current_version=(old.current_version||1)+1;}
  }
  const {data,error}=await ctx.db.from(c.table).update(changes).eq("id",id).select(c.select).single(); if(error)throw error;
  await audit(ctx.db,ctx.admin.id,`${resource}.updated`,c.table,id,changes);
  return NextResponse.json(data);
 }catch(e){return responseError(e);}
}
export async function DELETE(req:NextRequest,{params}:{params:Promise<{resource:string}>}){
 try{
  const {resource}=await params; const c=config[resource]; if(!c||!["campaigns","tasks"].includes(resource))return responseError("Deletion is not supported for this resource",400);
  const ctx=await requireAdmin(req,false); if(!ctx)return responseError("Unauthorized",401);
  const id=new URL(req.url).searchParams.get("id"); if(!id)return responseError("id is required",400);
  const {error}=await ctx.db.from(c.table).delete().eq("id",id); if(error)throw error;
  await audit(ctx.db,ctx.admin.id,`${resource}.deleted`,c.table,id); return new NextResponse(null,{status:204});
 }catch(e){return responseError(e);}
}