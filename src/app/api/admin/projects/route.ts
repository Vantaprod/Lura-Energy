import { NextRequest,NextResponse } from 'next/server';import { z } from 'zod';import { prisma } from '@/lib/db/prisma';import { getCurrentUser } from '@/lib/auth/session';import { can } from '@/lib/permissions/policy';import { sameOrigin } from '@/lib/security/origin';
const schema=z.object({title:z.string().trim().min(1).max(180),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),category:z.string().max(100).optional(),location:z.string().max(160).optional(),description:z.string().max(12000).optional(),systemCapacity:z.string().max(100).optional(),published:z.boolean().default(false)});
export async function GET(request:NextRequest){
 const user=await getCurrentUser();if(!user||!can(user.role,'content.read'))return NextResponse.json({error:'Unauthorized'},{status:401});
 const params=request.nextUrl.searchParams;const pageRaw=params.get('page');
 if(pageRaw===null)return NextResponse.json(await prisma.project.findMany({orderBy:{createdAt:'desc'}}));
 const pageInput=Number(pageRaw);if(!Number.isInteger(pageInput)||pageInput<1)return NextResponse.json({error:'Invalid page.'},{status:400});
 const q=(params.get('q')??'').trim().slice(0,120);const category=(params.get('category')??'').trim().slice(0,100);const state=params.get('state')??'';
 if(state&&state!=='PUBLISHED'&&state!=='DRAFT')return NextResponse.json({error:'Invalid state.'},{status:400});
 const where={...(category?{category}:{}),...(state?{published:state==='PUBLISHED'}:{}),...(q?{OR:['title','slug','category','location','description','systemCapacity'].map(field=>({[field]:{contains:q,mode:'insensitive' as const}}))}:{})};
 const pageSize=20;const [total,categories]=await Promise.all([prisma.project.count({where}),prisma.project.findMany({where:{category:{not:null}},select:{category:true},distinct:['category'],orderBy:{category:'asc'}})]);
 const pageCount=Math.max(1,Math.ceil(total/pageSize));const page=Math.min(pageInput,pageCount);
 const items=await prisma.project.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*pageSize,take:pageSize});
 return NextResponse.json({items,total,page,pageSize,pageCount,categories:categories.map(x=>x.category).filter((x):x is string=>Boolean(x))});
}
export async function POST(request:NextRequest){const user=await getCurrentUser();if(!user||!can(user.role,'content.manage'))return NextResponse.json({error:'Unauthorized'},{status:401});if(!sameOrigin(request))return NextResponse.json({error:'Invalid origin'},{status:403});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Invalid project details.'},{status:400});try{const item=await prisma.project.create({data:parsed.data});await prisma.auditLog.create({data:{actorId:user.id,action:'project.create',entityType:'project',entityId:item.id}});return NextResponse.json(item,{status:201});}catch{return NextResponse.json({error:'A project with that slug may already exist.'},{status:409});}}
