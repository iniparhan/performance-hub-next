# PROMPT

Aku mau kamu memperbaiki atau menyesuaikan code dalam projectku ini.
Gunakan informasi dari git terkait mana code yang di Update, Modify, dan juga di Delete, supaya kamu bisa mengecek lagi apakah perubahan yang ada sudah benar atau tidak.
Terutama pada `app/admin_dashboard` yang barusan aku buat, bagian DEFAULT_COLUMNS dan SAMPLE_DATA masih menggunakan global list yang biasa, sedangkan pada columns dan data, aku mau kolom table nya flexible menyesuaikan dengan kolom yang ada dan kuiinginkan (kolom yang aku inginkan terdapat pada ### TABLE SHOWS FOR ADMIN).

## Additional Information

### Database Schema

untuk bentuknya, kamu bisa melihat di `prisma/schema.prisma`

### TABLE SHOWS FOR ADMIN

FOR DEPART
evaluator (depart_evaluations.evaluator_id)
period(evaluations.period_id.quartal)
divisions (depart_evaluations.division_id)
depart_kpi (depart_scores.depart_kpi_id)
score (depart_scores.score)
notes (depart_scores.notes)
submitted_at (depart_evaluations.submitted_at)

FOR OFFICER
evaluator (evaluations.evaluator_id.name)
evaluatee (evaluations.evaluatee_id.name)
period (evaluations.period_id.quartal)
divisions (evaluations.evaluatee_id.division_id.name)
kpi (evaluation_scores.kpi_id.indicator_name)
score (evaluation_scores.score)
notes (evaluation_scores.notes)
submitted_at (evaluations.submitted_at)
