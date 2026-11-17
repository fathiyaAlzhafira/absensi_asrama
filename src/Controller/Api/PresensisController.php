<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Http\Response;
use App\Utility\GeoJsonFence;
use InvalidArgumentException;

class PresensisController extends ApiController
{
    /**
     * Riwayat Presensi Pengguna
     * GET /api/presensis/my-history
     */
    public function myHistory(): Response
    {
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }
        $presensisTable = $this->fetchTable('Presensis');

        $list = $presensisTable->find()
            ->where(['Presensis.user_id' => $user->id])
            ->order(['Presensis.tanggal' => 'DESC', 'Presensis.waktu' => 'DESC'])
            ->all();

        return $this->jsonSuccess($list->toArray());
    }

    /**
     * Status Presensi Hari Ini (Dashboard)
     * GET /api/presensis/today-status
     */
    public function todayStatus(): Response
    {
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }
        $presensisTable = $this->fetchTable('Presensis');
        $today = (new \DateTimeImmutable('now', new \DateTimeZone('Asia/Jakarta')))->format('Y-m-d');

        $subuh = $presensisTable->find()
            ->where(['user_id' => $user->id, 'tanggal' => $today, 'sesi' => 'subuh'])
            ->first();

        $malam = $presensisTable->find()
            ->where(['user_id' => $user->id, 'tanggal' => $today, 'sesi' => 'malam'])
            ->first();

        // Periksa apakah ada izin yang disetujui untuk sesi hari ini
        $izinsTable = $this->fetchTable('Izins');
        $approvedIzins = $izinsTable->find()
            ->where([
                'user_id' => $user->id,
                'status' => 'disetujui',
                'tanggal_mulai <=' => $today,
                'tanggal_selesai >=' => $today
            ])
            ->all();

        $subuhIzin = false;
        $malamIzin = false;
        foreach ($approvedIzins as $iz) {
            if ($iz->sesi === 'semua' || empty($iz->sesi)) {
                $subuhIzin = true;
                $malamIzin = true;
            } elseif ($iz->sesi === 'subuh') {
                $subuhIzin = true;
            } elseif ($iz->sesi === 'malam') {
                $malamIzin = true;
            }
        }

        $subuhData = $subuh ? ['status' => $subuh->status, 'waktu' => $subuh->waktu->format('H:i')] : ($subuhIzin ? ['status' => 'izin', 'waktu' => 'Izin Disetujui'] : null);
        $malamData = $malam ? ['status' => $malam->status, 'waktu' => $malam->waktu->format('H:i')] : ($malamIzin ? ['status' => 'izin', 'waktu' => 'Izin Disetujui'] : null);

        return $this->jsonSuccess([
            'today' => $today,
            'subuh' => $subuhData,
            'malam' => $malamData,
            'jadwal' => $this->scheduleConfig(),
        ]);
    }

    /**
     * Kirim Presensi
     * POST /api/presensis
     */
    public function add(): Response
    {
        $this->request->allowMethod(['post']);
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }
        if ($user->role !== 'penghuni') {
            return $this->jsonError('Hanya penghuni asrama yang dapat mengirim presensi.', 403);
        }

        $presensisTable = $this->fetchTable('Presensis');
        $resident = $this->fetchTable('Users')->find()
            ->where(['Users.id' => $user->id])
            ->contain(['Kamars' => ['Gedungs']])
            ->first();
        if ($resident === null || $resident->kamar === null || $resident->kamar->gedung === null) {
            return $this->jsonError('Pengguna belum memiliki penempatan kamar dan gedung.', 422);
        }
        $gedung = $resident->kamar->gedung;
        if (!$gedung->is_active) {
            return $this->jsonError('Gedung tempat tinggal sedang tidak aktif.', 422);
        }
        if (empty($gedung->geofence_geojson)) {
            return $this->jsonError('Batas geofence gedung belum dikonfigurasi.', 422);
        }

        $data = $this->request->getData();
        $now = new \DateTimeImmutable('now', new \DateTimeZone('Asia/Jakarta'));
        $minutes = ((int)$now->format('G') * 60) + (int)$now->format('i');
        $schedule = $this->scheduleBounds();
        $sesi = match (true) {
            $minutes >= $schedule['subuh_mulai'] && $minutes < $schedule['subuh_selesai'] => 'subuh',
            $minutes >= $schedule['malam_mulai'] && $minutes < $schedule['malam_selesai'] => 'malam',
            default => null,
        };

        if ($sesi === null || ($data['sesi'] ?? null) !== $sesi) {
            return $this->jsonError('Presensi sedang ditutup atau sesi sudah berakhir.', 422);
        }

        if ($presensisTable->exists([
            'user_id' => $user->id,
            'tanggal' => $now->format('Y-m-d'),
            'sesi' => $sesi,
        ])) {
            return $this->jsonError('Presensi ' . $sesi . ' hari ini sudah tercatat.', 409);
        }

        if (
            !isset($data['lat'], $data['long']) ||
            !is_numeric($data['lat']) ||
            !is_numeric($data['long']) ||
            (float)$data['lat'] < -90 ||
            (float)$data['lat'] > 90 ||
            (float)$data['long'] < -180 ||
            (float)$data['long'] > 180
        ) {
            return $this->jsonError('Lokasi perangkat belum tersedia atau tidak valid.', 422);
        }

        try {
            $geometry = GeoJsonFence::parse((string)$gedung->geofence_geojson);
        } catch (InvalidArgumentException $exception) {
            return $this->jsonError('Batas geofence gedung tidak valid.', 422);
        }
        if (!GeoJsonFence::contains($geometry, (float)$data['lat'], (float)$data['long'])) {
            return $this->jsonError('Lokasi berada di luar area gedung.', 422);
        }

        $photoData = $data['foto_wajah'] ?? '';
        if (
            !is_string($photoData) ||
            strlen($photoData) > 5_600_000 ||
            !preg_match('/\Adata:image\/jpeg;base64,([A-Za-z0-9+\/=]+)\z/', $photoData, $matches)
        ) {
            return $this->jsonError('Foto kamera tidak valid atau ukurannya terlalu besar.', 422);
        }

        $photoContents = base64_decode($matches[1], true);
        if ($photoContents === false || strlen($photoContents) > 4 * 1024 * 1024) {
            return $this->jsonError('Foto kamera tidak valid atau ukurannya terlalu besar.', 422);
        }

        $imageInfo = getimagesizefromstring($photoContents);
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        if (
            $imageInfo === false ||
            $imageInfo[0] > 4000 ||
            $imageInfo[1] > 4000 ||
            $finfo->buffer($photoContents) !== 'image/jpeg'
        ) {
            return $this->jsonError('Foto harus berupa gambar JPEG yang valid.', 422);
        }

        $uploadDirectory = ROOT . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'presensi';
        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true) && !is_dir($uploadDirectory)) {
            return $this->jsonError('Penyimpanan foto presensi tidak dapat disiapkan.', 500);
        }

        $filename = bin2hex(random_bytes(16)) . '.jpg';
        $photoPath = $uploadDirectory . DIRECTORY_SEPARATOR . $filename;
        if (file_put_contents($photoPath, $photoContents, LOCK_EX) !== strlen($photoContents)) {
            if (is_file($photoPath)) {
                unlink($photoPath);
            }
            return $this->jsonError('Foto presensi gagal disimpan.', 500);
        }

        $data = [
            'user_id' => $user->id,
            'tanggal' => $now->format('Y-m-d'),
            'waktu' => $now->format('H:i:s'),
            'sesi' => $sesi,
            'lat' => $data['lat'],
            'long' => $data['long'],
            'status' => 'hadir',
            'foto_wajah' => $filename,
        ];

        try {
            $presensi = $presensisTable->newEntity($data);
            if ($presensisTable->save($presensi)) {
                return $this->jsonSuccess($presensi->toArray(), 'Presensi berhasil dicatat!', 201);
            }
        } catch (\Throwable $error) {
            unlink($photoPath);
            throw $error;
        }

        unlink($photoPath);
        return $this->jsonError('Gagal mencatat presensi.', 422, $presensi->getErrors());
    }

    /**
     * Foto presensi milik penghuni yang sedang masuk.
     * GET /api/presensis/{id}/photo
     */
    public function photo(string $id): Response
    {
        $this->request->allowMethod(['get']);
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }

        $presensi = $this->fetchTable('Presensis')->find()
            ->where([
                'Presensis.id' => $id,
                'Presensis.user_id' => $user->id,
            ])
            ->first();

        if ($presensi === null || !preg_match('/\A[a-f0-9]{32}\.jpg\z/', (string)$presensi->foto_wajah)) {
            return $this->jsonError('Foto presensi tidak ditemukan.', 404);
        }

        $photoPath = ROOT . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'presensi'
            . DIRECTORY_SEPARATOR . $presensi->foto_wajah;
        if (!is_file($photoPath)) {
            return $this->jsonError('Foto presensi tidak ditemukan.', 404);
        }

        return $this->response->withFile($photoPath, ['download' => false]);
    }

    /**
     * @return array<string, string>
     */
    private function scheduleConfig(): array
    {
        $defaults = [
            'jam_subuh_mulai' => '04:00',
            'jam_subuh_selesai' => '06:00',
            'jam_malam_mulai' => '18:00',
            'jam_malam_selesai' => '20:30',
        ];
        try {
            $record = $this->fetchTable('PengaturanPresensi')->find()->orderBy(['id' => 'ASC'])->first();
            if ($record === null) {
                return $defaults;
            }
            $fmt = static function (mixed $val, string $fallback): string {
                if ($val instanceof \DateTimeInterface) {
                    return $val->format('H:i');
                }
                if (preg_match('/\A([01]\d|2[0-3]):([0-5]\d)/', str_replace('.', ':', (string)$val), $m)) {
                    return $m[1] . ':' . $m[2];
                }

                return $fallback;
            };

            return [
                'jam_subuh_mulai' => $fmt($record->jam_subuh_mulai, $defaults['jam_subuh_mulai']),
                'jam_subuh_selesai' => $fmt($record->jam_subuh_selesai, $defaults['jam_subuh_selesai']),
                'jam_malam_mulai' => $fmt($record->jam_malam_mulai, $defaults['jam_malam_mulai']),
                'jam_malam_selesai' => $fmt($record->jam_malam_selesai, $defaults['jam_malam_selesai']),
            ];
        } catch (\Throwable) {
            return $defaults;
        }
    }

    /**
     * @return array<string, int>
     */
    private function scheduleBounds(): array
    {
        $cfg = $this->scheduleConfig();
        $toMin = static function (string $hhmm): int {
            [$h, $m] = array_map('intval', explode(':', $hhmm));

            return ($h * 60) + $m;
        };

        return [
            'subuh_mulai' => $toMin($cfg['jam_subuh_mulai']),
            'subuh_selesai' => $toMin($cfg['jam_subuh_selesai']),
            'malam_mulai' => $toMin($cfg['jam_malam_mulai']),
            'malam_selesai' => $toMin($cfg['jam_malam_selesai']),
        ];
    }
}
