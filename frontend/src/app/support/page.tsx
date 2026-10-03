import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Bantuan My Jarvis Gua</h1>
      <section className="space-y-2">
        <h2 className="font-semibold">Lupa kata sandi</h2>
        <p>
          Gunakan email akun Anda di halaman pemulihan. Buka tautan pada email
          untuk memilih kata sandi baru.
        </p>
        <Link className="text-primary underline" href="/forgot-password">
          Pulihkan kata sandi
        </Link>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Hubungkan Telegram</h2>
        <p>
          Buka Profil, pilih Telegram Bot, lalu buat kode. Kirim perintah
          /connect beserta kode melalui chat pribadi bot. Kode berlaku sepuluh
          menit.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Pencatatan dan pencarian</h2>
        <p>
          Catat transaksi melalui formulir atau chat. Untuk pencarian makna
          dalam periode tertentu, gunakan filter tanggal. Tanggal relatif
          mengikuti zona waktu perangkat; Telegram memakai zona waktu terakhir
          yang disimpan saat login.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Ekspor dan cache</h2>
        <p>
          Pengaturan menyediakan ekspor CSV dan pembersihan cache lokal.
          Membersihkan cache tidak menghapus transaksi di server.
        </p>
      </section>
      <Link className="text-primary underline" href="/dashboard">
        Kembali ke dashboard
      </Link>
    </main>
  );
}
