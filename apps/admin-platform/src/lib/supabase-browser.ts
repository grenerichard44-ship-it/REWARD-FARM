import {createClient} from "@supabase/supabase-js";
let client:ReturnType<typeof createClient>|null=null;
export function supabaseBrowser(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key) return null;
 if(!client) client=createClient(url,key);
 return client;
}
export async function authHeaders():Promise<Record<string,string>>{
 const supabase=supabaseBrowser();
 const {data}=await supabase?.auth.getSession() || {data:{session:null}};
 return data.session?{Authorization:`Bearer ${data.session.access_token}`}:{};
}