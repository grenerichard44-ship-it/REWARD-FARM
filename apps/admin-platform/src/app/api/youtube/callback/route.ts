import {NextRequest,NextResponse} from "next/server";
import {createCipheriv,createHmac,randomBytes,timingSafeEqual} from "crypto";
import {adminClient} from "@/lib/admin-server";
export const runtime="nodejs";
function encrypt(value:string,keyText:string){const key=createHmac("sha256",keyText).update("reward-farm-youtube").digest();const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",key,iv);const body=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]).toString("base64")}
export async function GET(req:NextRequest){
 const url=new URL(req.url),code=url.searchParams.get("code"),state=url.searchParams.get("state"),secret=process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY,client=process.env.YOUTUBE_CLIENT_ID,clientSecret=process.env.YOUTUBE_CLIENT_SECRET,base=process.env.NEXT_PUBLIC_ADMIN_URL||url.origin;
 try{
  if(!code||!state||!secret||!client||!clientSecret)throw new Error("YouTube callback configuration is incomplete");
  const [payload,sig]=state.split("."),expected=createHmac("sha256",secret).update(payload).digest("base64url");
  if(!sig||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))throw new Error("Invalid OAuth state");
  const parsed=JSON.parse(Buffer.from(payload,"base64url").toString());if(parsed.e<Date.now())throw new Error("OAuth state expired");
  const tokenRes=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:client,client_secret:clientSecret,redirect_uri:`${base}/api/youtube/callback`,grant_type:"authorization_code"})});
  const tokens=await tokenRes.json();if(!tokenRes.ok)throw new Error(tokens.error_description||"Token exchange failed");
  const channelRes=await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",{headers:{Authorization:`Bearer ${tokens.access_token}`}});
  const channelBody=await channelRes.json();const channel=channelBody.items?.[0];if(!channel)throw new Error("No YouTube channel found");
  const db=adminClient();const {error}=await db.from("youtube_connections").upsert({user_id:parsed.u,channel_id:channel.id,channel_title:channel.snippet?.title,access_token_encrypted:encrypt(tokens.access_token,secret),refresh_token_encrypted:tokens.refresh_token?encrypt(tokens.refresh_token,secret):null,token_expires_at:new Date(Date.now()+(tokens.expires_in||3600)*1000).toISOString(),status:"active"},{onConflict:"user_id,channel_id"});if(error)throw error;
  return NextResponse.redirect(`${base}/guide?youtube=connected`);
 }catch(e){return NextResponse.redirect(`${base}/guide?youtube_error=${encodeURIComponent(e instanceof Error?e.message:String(e))}`)}
}