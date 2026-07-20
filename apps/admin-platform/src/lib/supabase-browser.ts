import {createClient} from "@supabase/supabase-js";
let client:ReturnType<typeof createClient>|null=null;
export function supabaseBrowser(){
 const url="https://gqnshjixcqnktgpgsvdt.supabase.co";
 const key="sb_publishable_n4Mw9NWaQ4w45ChJUxa7LQ_GjwOlH5y";
 if(!url||!key) return null;
 if(!client) client=createClient(url,key);
 return client;
}
export async function authHeaders():Promise<Record<string,string>>{
 const supabase=supabaseBrowser();
 const {data}=await supabase?.auth.getSession() || {data:{session:null}};
 return data.session?{Authorization:`Bearer ${data.session.access_token}`}:{};
}