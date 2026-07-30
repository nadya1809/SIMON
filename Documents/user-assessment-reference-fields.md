# Kontrak Referensi Penilaian Pengguna untuk SIMON

Dokumen ini disiapkan untuk developer atau AI agent yang mengerjakan integrasi di sisi SIMON.

Tujuan integrasi ini adalah membuat SIMON dapat mengambil referensi penilaian pengguna dari QueueBPS berdasarkan petugas dan tanggal penilaian yang dipilih admin SIMON. Data dari QueueBPS hanya menjadi referensi pendukung. Nilai akhir penilaian tetap diinput manual di SIMON.

## Ringkasan Alur

1. Admin SIMON memilih petugas.
2. Admin SIMON memilih tanggal penilaian.
3. SIMON mengirim request ke QueueBPS menggunakan `nip` petugas dan `assessmentDate`.
4. QueueBPS mengembalikan semua rating pelanggan untuk petugas tersebut pada tanggal tersebut.
5. SIMON menampilkan rating dan komentar tersebut sebagai referensi sebelum admin mengisi penilaian manual.

## Endpoint

```http
GET /api/user-assessment-reference?nip={nip}&assessmentDate={assessmentDate}
Authorization: Bearer {SIMON_INTEGRATION_TOKEN}
```

Base URL akan diberikan terpisah sesuai environment yang dipakai.

Untuk testing LAN/local:

```env
QUEUEBPS_BASE_URL=http://QUEUEBPS_LAN_IP:3000
SIMON_INTEGRATION_TOKEN=token_dev_simon_lan
```

Catatan:

- IP LAN dapat berubah mengikuti mesin yang menjalankan QueueBPS.
- Jangan hardcode URL QueueBPS di kode SIMON.
- Simpan base URL di env SIMON sebagai `QUEUEBPS_BASE_URL`.
- Token dibuat per environment. Token development/LAN dan production/demo harus berbeda.

Contoh:

```http
GET https://queuebps.example.com/api/user-assessment-reference?nip=199102112014121001&assessmentDate=2026-07-30
Authorization: Bearer simon_integration_token
```

## Parameter Request

| Parameter | Tipe | Wajib | Format | Keterangan |
| --- | --- | --- | --- | --- |
| `nip` | `string` | Ya | Digit NIP petugas | NIP petugas yang dipilih di SIMON. |
| `assessmentDate` | `string` | Ya | `YYYY-MM-DD` | Tanggal penilaian yang dipilih admin SIMON. |

Catatan:

- `assessmentDate` bebas dipilih oleh admin SIMON, baik tanggal lampau maupun tanggal mendatang.
- Jika tanggal yang dipilih belum memiliki data rating, QueueBPS akan mengembalikan `data: null`.
- Gunakan tanggal sesuai zona waktu Indonesia Barat.
- Format tanggal request wajib `YYYY-MM-DD`, misalnya `2026-07-30`.

## Header Wajib

| Header | Wajib | Keterangan |
| --- | --- | --- |
| `Authorization` | Ya | Gunakan format `Bearer {SIMON_INTEGRATION_TOKEN}`. |
| `Accept` | Disarankan | Gunakan `application/json`. |

Token integrasi tidak boleh ditaruh di query string, frontend publik, log browser, atau repository.

## Contoh Request Lengkap LAN

```http
GET http://QUEUEBPS_LAN_IP:3000/api/user-assessment-reference?nip=199102112014121001&assessmentDate=2026-07-30
Authorization: Bearer token_dev_simon_lan
Accept: application/json
```

## Struktur Response

Jika data ditemukan:

```json
{
  "data": {
    "nip": "199102112014121001",
    "assessmentDate": "2026-07-30",
    "assessments": [
      {
        "serviceRating": 5,
        "officerRating": 5,
        "comment": "Pelayanan cepat dan jelas."
      },
      {
        "serviceRating": 4,
        "officerRating": 5,
        "comment": "Tidak ada komentar dari pelanggan pada tanggal ini."
      }
    ],
    "assessmentCount": 2,
    "commentCount": 1
  }
}
```

Jika data tidak ditemukan:

```json
{
  "data": null
}
```

## Definisi Field Response

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `data` | `object \| null` | Berisi data referensi jika ditemukan. `null` jika tidak ada rating untuk NIP dan tanggal tersebut. |
| `data.nip` | `string` | NIP petugas yang dicari. |
| `data.assessmentDate` | `string` | Tanggal referensi sesuai request. |
| `data.assessments` | `array` | Daftar semua rating pelanggan pada tanggal tersebut untuk petugas tersebut. |
| `data.assessments[].serviceRating` | `number` | Rating layanan. Angka bulat 1 sampai 5. |
| `data.assessments[].officerRating` | `number` | Rating petugas. Angka bulat 1 sampai 5. |
| `data.assessments[].comment` | `string` | Komentar pelanggan atau teks fallback jika komentar kosong. |
| `data.assessmentCount` | `number` | Jumlah rating yang ditemukan. Sama dengan jumlah item di `assessments`. |
| `data.commentCount` | `number` | Jumlah komentar asli dari pelanggan yang tidak kosong. Tidak menghitung teks fallback. |

## TypeScript Contract untuk SIMON

```ts
type UserAssessmentReferenceResponse = {
  data: UserAssessmentReference | null;
};

type UserAssessmentReference = {
  nip: string;
  assessmentDate: string;
  assessments: UserAssessmentReferenceItem[];
  assessmentCount: number;
  commentCount: number;
};

type UserAssessmentReferenceItem = {
  serviceRating: number;
  officerRating: number;
  comment: string;
};
```

## Aturan Tampilan di SIMON

1. Tampilkan semua item di `assessments`, jangan hanya menampilkan rata-rata.
2. Jika `assessmentCount` bernilai `0` atau `data` bernilai `null`, tampilkan pesan: `Belum ada referensi penilaian pengguna`.
3. Jika `commentCount` bernilai `0`, SIMON cukup menampilkan isi field `comment` dari QueueBPS.
4. Jika `serviceRating` atau `officerRating` bernilai `1` atau `2`, SIMON boleh memberi penanda warna merah atau status perlu perhatian.
5. Jangan jadikan data QueueBPS sebagai nilai final otomatis. Admin SIMON tetap mengisi nilai penilaian manual.

## Contoh Kondisi Data

### Satu petugas melayani lima pelanggan pada tanggal yang dipilih

Jika lima pelanggan memberi rating pada tanggal tersebut, QueueBPS mengembalikan lima item:

```json
{
  "data": {
    "nip": "199102112014121001",
    "assessmentDate": "2026-07-30",
    "assessments": [
      { "serviceRating": 5, "officerRating": 5, "comment": "Pelayanan cepat." },
      { "serviceRating": 4, "officerRating": 5, "comment": "Petugas ramah." },
      { "serviceRating": 5, "officerRating": 4, "comment": "Tidak ada komentar dari pelanggan pada tanggal ini." },
      { "serviceRating": 3, "officerRating": 4, "comment": "Informasi cukup jelas." },
      { "serviceRating": 2, "officerRating": 2, "comment": "Waktu tunggu masih lama." }
    ],
    "assessmentCount": 5,
    "commentCount": 4
  }
}
```

### Ada rating tetapi tidak ada komentar asli

```json
{
  "data": {
    "nip": "199102112014121001",
    "assessmentDate": "2026-07-30",
    "assessments": [
      {
        "serviceRating": 4,
        "officerRating": 4,
        "comment": "Tidak ada komentar dari pelanggan pada tanggal ini."
      }
    ],
    "assessmentCount": 1,
    "commentCount": 0
  }
}
```

### Tidak ada rating pada tanggal tersebut

```json
{
  "data": null
}
```

## Error yang Perlu Ditangani SIMON

| HTTP Status | Kondisi | Saran Handling di SIMON |
| --- | --- | --- |
| `400` | Parameter tidak valid, misalnya tanggal bukan `YYYY-MM-DD`. | Tampilkan pesan validasi dan minta admin memperbaiki input. |
| `401` | Token tidak ada atau salah. | Jangan retry terus-menerus. Tampilkan error integrasi dan minta admin teknis mengecek token. |
| `429` | Terkena rate limit. | Tampilkan pesan sementara dan retry setelah jeda. |
| `500` | Error server QueueBPS. | Tampilkan fallback dan izinkan admin tetap mengisi penilaian manual. |

Response error akan berbentuk JSON dan tidak boleh diasumsikan sebagai data referensi.

Contoh response error:

```json
{
  "success": false,
  "error": "Parameter tidak valid."
}
```

## Keamanan untuk Developer SIMON

1. Simpan `SIMON_INTEGRATION_TOKEN` hanya di environment server SIMON.
2. Request ke QueueBPS harus dilakukan dari backend SIMON, bukan langsung dari browser.
3. Jangan mencetak token ke console, log, telemetry, atau error tracking.
4. Jangan menyimpan response QueueBPS sebagai data master permanen kecuali memang dibutuhkan oleh kebijakan SIMON.
5. Jangan meminta atau menyimpan NIK, nomor telepon, email pelanggan, nomor tiket, token publik, atau data lain di luar kontrak ini.
6. Jika perlu cache, batasi cache berdasarkan `nip` dan `assessmentDate`, serta gunakan masa berlaku pendek.

## Catatan Testing LAN

- QueueBPS harus dijalankan dengan host yang bisa diakses dari jaringan LAN.
- Contoh command QueueBPS:

```bash
pnpm dev --hostname 0.0.0.0
```

- SIMON mengakses IP mesin QueueBPS, bukan `localhost`.
- Jika SIMON dan QueueBPS berjalan di mesin berbeda, `localhost` pada SIMON berarti mesin SIMON sendiri.
- Jika terkena rate limit saat testing LAN, tunggu sebentar lalu retry.

## Catatan Rate Limit

- Angka final belum dikunci.
- Rekomendasi awal QueueBPS: `60 request/menit`.
- Rate limit dapat berlaku per token atau per IP server SIMON.

## Catatan Production

- Token development/LAN hanya untuk testing.
- Saat production/demo, QueueBPS akan memberikan base URL final dan token production.
- Token production tidak boleh disimpan di frontend, query string, log, atau repository.
- Request ke QueueBPS harus tetap dilakukan dari backend SIMON.

## Checklist Implementasi SIMON

- [ ] Tambahkan env server untuk `QUEUEBPS_BASE_URL`.
- [ ] Tambahkan env server untuk `SIMON_INTEGRATION_TOKEN`.
- [ ] Buat client backend untuk memanggil endpoint QueueBPS.
- [ ] Validasi `nip` dan `assessmentDate` sebelum request.
- [ ] Kirim header `Authorization: Bearer ...`.
- [ ] Tangani `data: null`.
- [ ] Tampilkan semua item `assessments`.
- [ ] Tampilkan fallback komentar jika komentar kosong.
- [ ] Pastikan rating rendah dapat ditandai jelas di UI.
- [ ] Pastikan admin SIMON tetap bisa input manual walaupun QueueBPS tidak mengembalikan data.
- [ ] Jangan expose token ke frontend.

## Catatan Penting

Data referensi ini berasal dari rating pelanggan di QueueBPS yang terkait dengan tiket antrean yang sudah dilayani oleh petugas. SIMON tidak perlu mengetahui detail tiket, data pelanggan, atau struktur internal QueueBPS. SIMON cukup memakai NIP dan tanggal penilaian untuk mengambil referensi yang relevan.
