-- Allow students to view all students for leaderboard
CREATE POLICY "Students can view all students for leaderboard" ON students
FOR SELECT TO public
USING (get_my_role() = 'student');
