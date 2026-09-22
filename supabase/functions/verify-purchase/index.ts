// Deploy only after configuring a trusted verifier service. This function
// intentionally fails closed when store verification is unavailable.
const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});

Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(request.method!=='POST')return json({error:'method_not_allowed'},405);
  const supabaseUrl=Deno.env.get('SUPABASE_URL'),anonKey=Deno.env.get('SUPABASE_ANON_KEY'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const verifierUrl=Deno.env.get('PURCHASE_VERIFIER_URL'),verifierSecret=Deno.env.get('PURCHASE_VERIFIER_SECRET');
  if(!supabaseUrl||!anonKey||!serviceKey||!verifierUrl||!verifierSecret)return json({error:'purchase_verification_not_configured'},503);
  const authorization=request.headers.get('Authorization')||'';
  const userResponse=await fetch(`${supabaseUrl}/auth/v1/user`,{headers:{apikey:anonKey,Authorization:authorization}});
  if(!userResponse.ok)return json({error:'not_authenticated'},401);
  const user=await userResponse.json();
  const body=await request.json().catch(()=>null),platform=body?.platform,productId=body?.productId,transactionId=body?.transactionId,proof=body?.proof;
  if(!['android','ios'].includes(platform)||typeof productId!=='string'||typeof transactionId!=='string'||typeof proof!=='string')return json({error:'invalid_receipt'},400);
  const verification=await fetch(verifierUrl,{method:'POST',headers:{Authorization:`Bearer ${verifierSecret}`,'Content-Type':'application/json'},body:JSON.stringify({platform,productId,transactionId,proof,userId:user.id})});
  const result=await verification.json().catch(()=>null);
  if(!verification.ok||result?.valid!==true||result?.productId!==productId||result?.transactionId!==transactionId)return json({error:'receipt_not_verified'},422);
  const grant=await fetch(`${supabaseUrl}/rest/v1/rpc/economy_grant_verified_purchase`,{method:'POST',headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'},body:JSON.stringify({p_user:user.id,p_platform:platform,p_transaction:transactionId,p_product:productId})});
  const granted=await grant.json().catch(()=>null);if(!grant.ok)return json({error:granted?.message||'credit_failed'},409);
  return json({ok:true,grant:granted});
});
