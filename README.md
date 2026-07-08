# What's Next?

- Modifikasi flownya, biar kalo bagian dashboard menyesuaikan period atau quartal yang terbuka, tapi khusus untuk pertanyaannya, jika di cek di evaluation_periods.is_active == TRUE maka pertanyaan akan baru, tetapi ini tidak berlaku untuk bagian "Personal Performance Overview", "Qualitative Feedback"
- buat code supaya ketika setelah input nilai pada tiap officer, disimpan dulu di local atau cache, baru kalau sudah semua, langsung di PUT atau di push ke database bersamaan

=== DONE ===

- modifikasi button back pada modal
- buat "modal" pertanyaan performance tracker
- buat tombol logout
- modifikasi UI login biar bagus
- nambah tulisan atau text yang belum masuk

# Mau nge-running?

```bash

npx prisma validate     # Kalo mau nge check prisma oke atau engga
npx prisma migrate dev --name add-performance-indexes       # Opsional
npx prisma generate

npm run dev or npm run build

```
