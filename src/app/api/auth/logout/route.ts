import { NextRequest,NextResponse } from 'next/server'; import { deleteCurrentSession } from '@/lib/auth/session'; import { sameOrigin } from '@/lib/security/origin';
export async function POST(request:NextRequest){if(!sameOrigin(request))return NextResponse.json({error:'Invalid origin'},{status:403});await deleteCurrentSession();return NextResponse.json({ok:true});}
