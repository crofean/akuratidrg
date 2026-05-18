<?php
/**
 * Script Penolong Ekstraksi SAK-iDRG
 * Digunakan jika panel hosting tidak memiliki fitur Unzip.
 */

$zipFile = 'dist_upload.zip';
$zip = new ZipArchive;

header('Content-Type: text/html; charset=utf-8');

if ($zip->open($zipFile) === TRUE) {
    // Ekstrak ke direktori saat ini
    if ($zip->extractTo('./')) {
        echo "<div style='font-family: sans-serif; padding: 20px; border: 2px solid #22c55e; border-radius: 10px; background: #f0fdf4; color: #166534;'>";
        echo "<h2>✅ Ekstraksi Berhasil!</h2>";
        echo "<p>File aplikasi SAK-iDRG telah berhasil dikeluarkan.</p>";
        echo "<p><strong>Langkah selanjutnya:</strong></p>";
        echo "<ul>
                <li>Buka website Anda di: <a href='/' style='color: #15803d; font-weight: bold;'>Klik di sini</a></li>
                <li><strong>PENTING:</strong> Segera hapus file <code>extract.php</code> dan <code>dist_upload.zip</code> dari server demi keamanan.</li>
              </ul>";
        echo "</div>";
    } else {
        echo "<div style='color: red;'>Gagal mengekstrak file. Pastikan izin folder (permission) sudah benar (755).</div>";
    }
    $zip->close();
} else {
    echo "<div style='font-family: sans-serif; padding: 20px; border: 2px solid #ef4444; border-radius: 10px; background: #fef2f2; color: #991b1b;'>";
    echo "<h2>❌ Gagal!</h2>";
    echo "<p>File <code>$zipFile</code> tidak ditemukan atau tidak bisa dibuka.</p>";
    echo "<p>Pastikan file tersebut sudah diunggah di folder yang sama dengan script ini.</p>";
    echo "</div>";
}
?>
