import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { name, email, student_id, class_id } = await req.json()

    if (!name || !email || !class_id) {
      return new Response(JSON.stringify({ error: 'Name, email, and class_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const temporaryPassword = Math.random().toString(36).slice(-8)

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { name: name, role: 'student' }
    })

    if (authError) {
      // Provide a more specific error message if the user already exists
      if (authError.message.includes('already registered')) {
          return new Response(JSON.stringify({ error: 'A user with this email is already registered.' }), {
              status: 409, // Conflict
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }
      throw authError;
    }
    
    if (!authData.user) throw new Error('User creation failed in authentication service.')

    const userId = authData.user.id

    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({ 
        user_id: userId, 
        name, 
        email, 
        student_id,
        class_id 
      })
      .select()
      .single()

    if (studentError) {
        // If student profile creation fails, we should delete the auth user to avoid orphans
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw studentError;
    }
    
    if (!studentData) throw new Error('Student profile creation failed.');

    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: userId,
      role: 'student',
      profile_id: studentData.id,
    })

    if (roleError) {
        // Also delete auth user and student profile if role assignment fails
        await supabaseAdmin.auth.admin.deleteUser(userId);
        await supabaseAdmin.from('students').delete().eq('id', studentData.id);
        throw roleError;
    }

    return new Response(
      JSON.stringify({ 
        message: 'Student created successfully!', 
        student: studentData,
        temporaryPassword: temporaryPassword
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
