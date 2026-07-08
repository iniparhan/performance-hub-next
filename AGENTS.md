- Aku sudah menyesuaikan ini, yaitu cek flownya. Apabila kalo bagian dashboard menyesuaikan period atau quartal yang terbuka, tapi khusus untuk pertanyaannya, jika di cek di evaluation_periods.is_active == TRUE maka pertanyaan akan baru, tetapi ini tidak berlaku untuk bagian "Personal Performance Overview", "Qualitative Feedback"
- nambah tulisan atau text yang belum masuk
  path :AppraisalModal.jsx
  targets.map((target) => (
  <div className="target-card" key={target.targetEmail}>
  <div>
  <h3>{target.targetName}</h3>
  <p>
  {target.targetRole} • {target.targetDepartment} •{" "}
  {target.targetSubDepartment}
  </p>
  <p>
  {target.relationship} • {target.divisionScope}
  </p>
  </div>

  path :AppraisalModal.jsx
  <div className="selected-target">
  <h3>{selectedTarget.targetName}</h3>
  <p>
  {selectedTarget.targetRole ?? selectedTarget.role?.name ?? "-"} •{" "}
  {selectedTarget.targetDepartment ??
  selectedTarget.division?.name ??
  "-"}{" "}
  •{" "}
  {selectedTarget.targetSubDepartment ??
  selectedTarget.subDivision?.name ??
  "-"}
  </p>
  </div>

- validasi placeholder="Write your notes here..." supaya harus mengisi, dan tidak akan bisa submit jika belum diisi
- pada "Qualitative Feedback", aku mau kamu memunculkan semua isi evaluation_scores.notes dalam bentuk bento card. Dan bentuknya bisa menggunakan FeedbackGrid di components. Aku mau evaluation_scores.notes yang keluar, hanya ditujukan untuk user, contoh: aku dengan evaluations.evaluatee_id == 12, akan mengambil evaluations.id untuk dicari pada evaluations_scores.evaluation_id, dan kemudian akan mengambil evaluations_scores.notes. CATATAN!!: dalam hal ini, aku hanya ingin menampilkan evaluations.period_id selain dari 1.
- pada "Personal Performance Overview", aku ingin ketika user memilih class="quarter-selector", maka user bisa bebas melihat nilainya sesuai dengan quarter yang dipilih. Yang dimana akan menampilkan visualisasi spiderchart dengan menampilkan indicator pada sudut sesuai dengan banyaknya indicator pada si user. Dan karena terdapat beberapa penilaian yang atas ke bawah, dan bawah ke atas (aku sebagai manager menerima nilai dan juga mendapat nilai dari bawahan atau officer, sedangkan dari atas atau bawah memiliki indicator yang berbeda) aku mau menyesuaikan, jika terdapat 2 penilaian atas bawah, aku mau kamu automatis menambahkan 1 lagi spidercharnya. untuk penilaian dari atas ke bawah, yang aku mau kamu hanya menampilkan kpis.type == DOWNWARD_GENERAL, dan apabila bawah ke atas menampilkan kpis.type == UPWARD
- tes semua error

NOTE : gunakan "prisma/schema.prisma" sebagai alat bantu untuk mengetahui schema database pada project ini
