import {NextRequest,NextResponse} from "next/server";
import {createHmac} from "crypto";
import {requireAdmin} from "@/lib/admin-server";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const ctx=await requireAdmin(req); if(!ctx)return NextResponse.json({error:"Unauthorized"},{status:401});
 const client=process.env.YOUTUBE_CLIENT_ID, secret=process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY, base=process.env.NEXT_PUBLIC_ADMIN_URL||new URL(req.url).origin;
 if(!client||!secret)return NextResponse.json({error:"YouTube environment is incomplete"},{status:503});
 const payload=Buffer.from(JSON.stringify({u:ctx.user.id,e:Date.now()+600000})).toString("base64url");
 const sig=createHmac("sha256",secret).update(payload).digest("base64url");
 const p=new URLSearchParams({client_id:client,redirect_uri:`${base}/api/youtube/callback`,response_type:"code",access_type:"offline",prompt:"consent",scope:"https://www.googleapis.com/auth/youtube.readonly",state:`${payload}.${sig}`});
 return NextResponse.json({url:`https://accounts.google.com/o/oauth2/v2/auth?${p}`});
}