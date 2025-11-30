/// <reference no-default-lib="true"/>
/// <reference types="https://deno.land/x/supabase_functions@0.2.0/index.d.ts" />
/// <reference lib="deno.window" />

import { serve } from 'https://deno.land/std@0.200.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import mammoth from 'npm:mammoth@1.6.0';
import pdf from 'npm:pdf-parse@1.1.1';

// @ts-ignore: Deno global is available in Supabase Edge Functions
// @ts-nocheck
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.5.0';

// IMPORTANT: Set these environment variables in your Supabase project settings
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
if (!geminiApiKey) {
  throw new Error('Google Gemini API key is not set in environment variables.');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Be more specific for production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let filePath;
  let body;
  try {
    // Log headers and method for debugging
    console.log('Request Method:', req.method);
    console.log('Content-Type Header:', req.headers.get('Content-Type'));

    body = await req.json();
    filePath = body.filePath;
  } catch (e: any) {
    console.error('Error parsing request body:', e); // Log the specific error
    console.error('Full error details:', {
      message: e.message,
      stack: e.stack,
      cause: e.cause
    });
    return new Response(JSON.stringify({ error: `Invalid or missing JSON body: ${e.message}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!filePath) {
    return new Response(JSON.stringify({ error: 'File path not provided in request body.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // 1. Create a client with the user's auth token to verify they are logged in
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Create a new admin client with the service_role key to bypass RLS
    // IMPORTANT: Make sure to set SUPABASE_SERVICE_ROLE_KEY in your function's environment variables
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
        console.error('Critical Error: SUPABASE_SERVICE_ROLE_KEY is not set.');
        throw new Error('Server configuration error: Service role key is missing.');
    }
    const supabaseAdminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        serviceRoleKey,
        { auth: { persistSession: false } } // Important for server-side
    );


    // 3. Fetch the file from Supabase Storage using the admin client
    const { data: fileData, error: downloadError } = await supabaseAdminClient.storage
      .from('quiz_files') // Ensure this matches your bucket name
      .download(filePath);

    if (downloadError) {
      console.error('Supabase Storage Download Error:', downloadError);
      console.error('Full error details:', {
        message: downloadError.message,
        stack: downloadError.stack,
        cause: downloadError.cause
      });
      throw new Error(`Failed to download file from storage: ${downloadError.message}`);
    }

    if (!fileData) {
      throw new Error('Downloaded file data is empty.');
    }

    let text = '';
    const buffer = await fileData.arrayBuffer();

    // Determine file type from filePath extension or infer
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    let fileType = '';
    if (fileExtension === 'pdf') {
      fileType = 'application/pdf';
    } else if (fileExtension === 'docx') {
      fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
      throw new Error('Unsupported file type based on extension. Please upload a DOCX or PDF.');
    }

    if (fileType === 'application/pdf') {
      const pdfData = await pdf(buffer);
      text = pdfData.text;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Pass the data as a Buffer-like object (Uint8Array) for better compatibility in Deno
      const uint8array = new Uint8Array(buffer);
      const { value } = await mammoth.extractRawText({ buffer: uint8array });
      text = value;
    } else {
      // This case should ideally be caught by the fileExtension check above
      throw new Error('Unsupported file type. Please upload a DOCX or PDF.');
    }

    if (!text) {
      throw new Error('Could not extract text from the file.');
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
      You are an expert quiz generator. Analyze the provided text and create a comprehensive quiz in valid JSON format.

      ## CRITICAL REQUIREMENTS:
      1. Your response MUST be ONLY valid JSON - no explanations, no markdown formatting, no code blocks
      2. Do not wrap the JSON in \`\`\`json\`\`\` or any other formatting
      3. The JSON must be parseable without any cleaning
      4. Remove any special characters, escape sequences, or formatting that could break JSON parsing

      ## JSON STRUCTURE REQUIRED:
      {
        "title": "Quiz title based on the content",
        "description": "Brief description of what this quiz covers",
        "questions": [
          {
            "question_text": "The complete question text",
            "options": { "A": "First option text", "B": "Second option text", "C": "Third option text", "D": "Fourth option text" }, // IMPORTANT: 'options' MUST be a JSON object with keys "A", "B", "C", "D" and string values.
            "correct_answer_key": "A",
            "difficulty": "easy",
            "points": 2
          }
        ]
      }

      ## RULES:
      - Create 10-20 questions based on content complexity
      - Each question must have exactly 4 options (a, b, c, d)
      - difficulty must be exactly one of: "easy", "medium", "hard"
      - points should be: easy=2, medium=3, hard=5 (sesuai standar guru)
      - Distribute questions evenly across difficulty levels if possible
      - Ensure all questions are answerable from the provided text
      - Make questions diverse (factual, conceptual, application-based)
      - Avoid duplicate or overly similar questions
      - Use simple, clear language appropriate for students

      ## VALIDATION:
      Before responding, verify:
      - JSON is valid and complete
      - All required fields are present
      - No extra fields beyond the specified structure
      - All values are properly quoted strings or numbers
      - Array structures are correct

      ## TEXT TO ANALYZE:
      ${text}

      Remember: Output ONLY the JSON object, nothing else.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();

      // Clean the raw text to ensure it's pure JSON
      let cleanedText = rawText
        .replace(/```json\n?|```/g, '')
        .replace(/^[^{]*/, '') 
        .replace(/[^}]*$/, '')
        .trim();
      
      if (!cleanedText) {
        throw new Error('Gemini API response was empty or contained no valid JSON after cleaning.');
      }

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(cleanedText);
      } catch (parseError: any) {
        console.error('Problematic text that failed parsing:', cleanedText);
        throw new Error(`Gemini returned invalid JSON format: ${parseError.message}`);
      }

      const { title, description, questions } = jsonResponse;

      if (!title || !description || !Array.isArray(questions) || questions.length === 0) {
        console.error('Invalid quiz structure from Gemini:', jsonResponse);
        throw new Error('Generated quiz data is missing title, description, or questions.');
      }
      
      // Get the teacher's internal ID from the 'teachers' table using the user's auth ID
      const { data: teacherProfile, error: teacherError } = await supabaseAdminClient
        .from('teachers')
        .select('id')
        .eq('user_id', user.id) // user.id is the auth.uid()
        .single();

      if (teacherError || !teacherProfile) {
        console.error('Error fetching teacher profile:', teacherError);
        throw new Error('Could not find a teacher profile for the authenticated user.');
      }
      const teacherId = teacherProfile.id;

      // Insert the quiz and get its ID
      // Helper function to get points based on difficulty
      const getPointsForDifficulty = (difficulty: string): number => {
        switch (difficulty.toLowerCase()) {
          case 'easy': return 2;
          case 'medium': return 3;
          case 'hard': return 5;
          default: return 3; // default to medium
        }
      };

      // Prepare questions for insertion, with validation
      const questionsToInsert = questions
        .map((q: any, index: number) => {
          if (!q.question_text || typeof q.options !== 'object' || q.options === null || !q.correct_answer_key) {
            console.warn('Skipping malformed question object from Gemini:', q);
            return null;
          }
          const correctAnswer = String(q.correct_answer_key || 'A').toUpperCase();
          const difficulty = (['easy', 'medium', 'hard'].includes(q.difficulty?.toLowerCase()) ? q.difficulty.toLowerCase() : 'medium');
          return {
            quiz_id: '', // Temporarily empty, will be filled after quiz insertion
            question_text: q.question_text,
            options: q.options,
            correct_answer: correctAnswer,
            difficulty: difficulty,
            points: getPointsForDifficulty(difficulty),
            question_order: index + 1,
          };
        })
        .filter((q: any) => q !== null);

      // Insert the quiz and get its ID
      const { data: newQuiz, error: quizError } = await supabaseAdminClient
        .from('quizzes')
        .insert({
          title,
          description,
          total_questions: questionsToInsert.length,
          created_by: teacherId, // Use the teacher's ID from teachers table
          teacher_id: user.id, // Use auth.uid() for RLS
          total_points: questionsToInsert.reduce((sum: number, q: any) => sum + q.points, 0), // Calculate total points
        })
        .select('id, created_at, total_points')
        .single();

      if (quizError) {
        console.error('Error inserting quiz:', quizError);
        throw quizError;
      }

      const quizId: string = newQuiz.id;
      console.log(`Successfully created quiz with ID: ${quizId}`);

      // Assign quiz_id to questionsToInsert
      questionsToInsert.forEach((q: any) => q.quiz_id = quizId);

      if (questionsToInsert.length === 0) {
        await supabaseAdminClient.from('quizzes').delete().eq('id', quizId);
        throw new Error('All generated questions were malformed. Quiz creation rolled back.');
      }

      // Insert the questions
      const { error: questionsError } = await supabaseAdminClient
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('FATAL ERROR during question insertion:', questionsError);
        await supabaseAdminClient.from('quizzes').delete().eq('id', quizId);
        console.log(`Rolled back creation of quiz ${quizId} due to question insertion failure.`);
        throw questionsError;
      }

      console.log(`Successfully inserted ${questionsToInsert.length} questions for quiz ${quizId}.`);

      // Prepare the final response object
      const finalQuizObject = {
        id: quizId,
        title,
        description,
        created_at: newQuiz.created_at,
        total_questions: questionsToInsert.length,
        total_points: newQuiz.total_points, // Include total_points in the response
        questionCount: questionsToInsert.length,
      };

      return new Response(JSON.stringify(finalQuizObject), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (error: unknown) {
      console.error('Error in create-quiz-from-file function:', error);
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  } catch (error: unknown) {
    console.error('Error in create-quiz-from-file function:', error);
    console.error('Full error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      cause: (error as Error).cause
    });
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
