Saya sedang mengerjakan project Next.js dengan struktur seperti ini:

```txt
app/
  login/
    page.jsx

  dashboard/
    page.jsx

  api/
    auth/
      login/
        route.js
      me/
        route.js
      logout/
        route.js

    evaluatees/
      route.js

    evaluations/
      route.js
      [id]/
        route.js
        scores/
          route.js
        submit/
          route.js

services/
  authService.js
  evaluationService.js

lib/
  prisma.js

components/
  ...
```

Saya ingin kamu jelaskan alur flow project ini secara runtut dari awal website dibuka sampai data berhasil ditampilkan atau disimpan.

Tolong jelaskan dengan format:

1. Apa fungsi setiap folder utama, seperti `app`, `api`, `services`, `lib`, dan `components`.
2. Flow saat user membuka halaman login.
3. Flow saat user submit form login.
4. Flow saat frontend memanggil function dari `services`.
5. Flow saat request masuk ke endpoint `app/api/.../route.js`.
6. Flow saat endpoint memakai Prisma untuk akses database.
7. Flow response dari database sampai kembali ke UI.
8. Contoh alur lengkap dengan format seperti:
   `page.jsx → services/*.js → app/api/.../route.js → Prisma → Database → response → UI`.
9. Jelaskan juga file mana yang berjalan di client dan file mana yang berjalan di server.
10. Berikan catatan best practice agar struktur project ini tidak berantakan.

Gunakan bahasa Indonesia yang jelas dan mudah dipahami. Anggap saya masih belajar Next.js, tapi sudah paham dasar JavaScript.
