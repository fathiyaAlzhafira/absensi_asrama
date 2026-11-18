<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Http\Response;

class IzinsController extends ApiController
{
    /**
     * Daftar Izin Saya (Penghuni)
     * GET /api/izins/my-permits
     */
    public function myPermits(): Response
    {
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }
        $izinsTable = $this->fetchTable('Izins');

        $list = $izinsTable->find()
            ->where(['Izins.user_id' => $user->id])
            ->orderBy(['Izins.created_at' => 'DESC'])
            ->all();

        return $this->jsonSuccess($list->toArray());
    }

    /**
     * Ajukan Izin Baru
     * POST /api/izins
     */
    public function add(): Response
    {
        $this->request->allowMethod(['post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }
        $userId = $user->id;
        $izinsTable = $this->fetchTable('Izins');

        $data = $this->request->getData();
        $data['user_id'] = $user->id;
        $data['status'] = 'pending';

        $sesi = $data['sesi'] ?? 'semua';
        if (!in_array($sesi, ['semua', 'subuh', 'malam'], true)) {
            $sesi = 'semua';
        }
        $data['sesi'] = $sesi;

        if (empty($data['jenis_izin'])) {
            return $this->jsonError('Kategori izin wajib dipilih.', 422);
        }

        if (empty($data['tanggal_mulai']) || empty($data['tanggal_selesai'])) {
            return $this->jsonError('Tanggal mulai dan selesai izin wajib diisi.', 422);
        }

        $now = new \DateTimeImmutable('now', new \DateTimeZone('Asia/Jakarta'));
        $today = $now->format('Y-m-d');
        if ($data['tanggal_mulai'] < $today) {
            return $this->jsonError('Tidak dapat mengajukan izin pada tanggal yang sudah lampau.', 422);
        }

        if (strtotime((string)$data['tanggal_selesai']) < strtotime((string)$data['tanggal_mulai'])) {
            return $this->jsonError('Tanggal selesai izin tidak boleh lebih awal dari tanggal mulai izin.', 422);
        }

        // Jika izin diajukan mulai hari ini, pastikan sesi presensi yang diajukan belum berakhir
        if ($data['tanggal_mulai'] === $today) {
            $schedule = $this->scheduleEndTimes();
            $currentMinutes = ((int)$now->format('G') * 60) + (int)$now->format('i');

            if ($sesi === 'subuh' && $currentMinutes >= $schedule['subuh_selesai_min']) {
                return $this->jsonError(
                    "Batas waktu Sesi Subuh hari ini (pukul {$schedule['jam_subuh_selesai']} WIB) sudah berakhir. Pengajuan izin hanya dapat dilakukan sebelum sesi presensi berakhir.",
                    422
                );
            }
            if ($sesi === 'malam' && $currentMinutes >= $schedule['malam_selesai_min']) {
                return $this->jsonError(
                    "Batas waktu Sesi Malam hari ini (pukul {$schedule['jam_malam_selesai']} WIB) sudah berakhir. Pengajuan izin hanya dapat dilakukan sebelum sesi presensi berakhir.",
                    422
                );
            }
            if ($sesi === 'semua') {
                if ($currentMinutes >= $schedule['malam_selesai_min']) {
                    return $this->jsonError(
                        'Seluruh sesi presensi hari ini (Subuh & Malam) sudah berakhir. Silakan ajukan izin mulai tanggal besok.',
                        422
                    );
                }
                if ($currentMinutes >= $schedule['subuh_selesai_min']) {
                    return $this->jsonError(
                        "Sesi Subuh hari ini (pukul {$schedule['jam_subuh_selesai']} WIB) sudah ditutup sehingga tidak dapat diajukan dalam 'Semua Sesi' untuk hari ini. Jika ingin izin untuk malam ini, pilih 'Hanya Sesi Malam', atau mulai izin 'Semua Sesi' dari tanggal besok.",
                        422
                    );
                }
            }
        }

        // Periksa apakah penghuni sudah memiliki catatan presensi (hadir/terlambat/alpa) pada tanggal dan sesi yang diajukan
        $presensiQuery = $this->fetchTable('Presensis')->find()
            ->where([
                'user_id' => $userId,
                'status IN' => ['hadir', 'terlambat', 'alpa', 'alfa'],
                'tanggal >=' => $data['tanggal_mulai'],
                'tanggal <=' => $data['tanggal_selesai'],
            ]);
        if ($sesi !== 'semua') {
            $presensiQuery->where(['sesi' => $sesi]);
        }
        $existingPresensi = $presensiQuery->orderBy(['tanggal' => 'ASC'])->first();
        if ($existingPresensi !== null) {
            $presensiDate = is_object($existingPresensi->tanggal) && method_exists($existingPresensi->tanggal, 'format')
                ? $existingPresensi->tanggal->format('Y-m-d')
                : (string)$existingPresensi->tanggal;
            $sesiLabel = $existingPresensi->sesi === 'subuh' ? 'Sesi Subuh' : 'Sesi Malam';
            $isAlfa = in_array(strtolower((string)$existingPresensi->status), ['alpa', 'alfa'], true);
            if ($isAlfa) {
                return $this->jsonError(
                    "{$sesiLabel} pada tanggal {$presensiDate} sudah berakhir dan tercatat Alfa. Pengajuan izin hanya dapat dilakukan sebelum sesi presensi berakhir.",
                    422
                );
            }
            if ($sesi === 'semua') {
                $saranSesi = $existingPresensi->sesi === 'subuh' ? 'Hanya Sesi Malam' : 'Hanya Sesi Subuh';
                return $this->jsonError(
                    "Anda sudah mengambil presensi {$sesiLabel} pada tanggal {$presensiDate}. Tidak dapat mengajukan izin 'Semua Sesi' pada hari yang sesinya sudah dihadiri (pilih '{$saranSesi}' jika ingin izin untuk sesi lainnya).",
                    422
                );
            }

            return $this->jsonError(
                "Anda sudah mengambil presensi {$sesiLabel} pada tanggal {$presensiDate}. Tidak dapat mengajukan izin untuk sesi yang sudah dihadiri.",
                422
            );
        }

        // Periksa apakah sudah ada pengajuan izin aktif pada tanggal dan sesi yang bertabrakan
        $queryOverlap = $izinsTable->find()
            ->where([
                'user_id' => $userId,
                'status IN' => ['pending', 'disetujui'],
                'tanggal_mulai <=' => $data['tanggal_selesai'],
                'tanggal_selesai >=' => $data['tanggal_mulai']
            ]);

        if ($sesi === 'semua') {
            // Jika izin seharian penuh, bentrok dengan izin apa pun pada rentang tanggal tersebut
            $overlapping = $queryOverlap->first();
        } else {
            // Jika izin per sesi (subuh / malam), hanya bentrok jika sudah ada izin 'semua' atau sesi yang sama
            $overlapping = $queryOverlap
                ->where(['sesi IN' => ['semua', $sesi]])
                ->first();
        }

        if ($overlapping) {
            $existingStart = $overlapping->tanggal_mulai instanceof \Cake\I18n\Date ? $overlapping->tanggal_mulai->format('Y-m-d') : (string)$overlapping->tanggal_mulai;
            $existingEnd = $overlapping->tanggal_selesai instanceof \Cake\I18n\Date ? $overlapping->tanggal_selesai->format('Y-m-d') : (string)$overlapping->tanggal_selesai;
            $existingSesiText = $overlapping->sesi === 'subuh' ? 'Sesi Subuh' : ($overlapping->sesi === 'malam' ? 'Sesi Malam' : 'Semua Sesi');
            $statusText = $overlapping->status === 'pending' ? 'menunggu verifikasi' : 'sudah disetujui';
            return $this->jsonError("Anda sudah memiliki pengajuan izin pada rentang tanggal tersebut ({$existingStart} s/d {$existingEnd}, {$existingSesiText} - status: {$statusText}). Tidak dapat mengajukan izin pada sesi yang bertabrakan.", 422);
        }

        if (empty($data['keterangan']) || trim((string)$data['keterangan']) === '') {
            return $this->jsonError('Alasan detail permohonan izin wajib diisi.', 422);
        }

        // Tangani upload file jika ada (mendukung PSR-7 UploadedFileInterface maupun array $_FILES)
        $file = $this->request->getData('bukti_file');
        $uploadedPath = null;

        if ($file && is_object($file) && method_exists($file, 'getClientFilename') && !empty($file->getClientFilename())) {
            $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientFilename());
            $targetDir = WWW_ROOT . 'uploads' . DS . 'izin';
            if (!is_dir($targetDir)) {
                mkdir($targetDir, 0777, true);
            }
            $targetPath = $targetDir . DS . $filename;
            $file->moveTo($targetPath);
            $uploadedPath = 'uploads/izin/' . $filename;
        } elseif (is_array($file) && !empty($file['name']) && !empty($file['tmp_name']) && is_uploaded_file($file['tmp_name'])) {
            $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', (string)$file['name']);
            $targetDir = WWW_ROOT . 'uploads' . DS . 'izin';
            if (!is_dir($targetDir)) {
                mkdir($targetDir, 0777, true);
            }
            $targetPath = $targetDir . DS . $filename;
            move_uploaded_file($file['tmp_name'], $targetPath);
            $uploadedPath = 'uploads/izin/' . $filename;
        } elseif (is_string($file) && !empty($file) && !is_object($file)) {
            $uploadedPath = $file;
        }

        if (!$uploadedPath) {
            return $this->jsonError('Berkas lampiran bukti izin wajib diunggah (JPG, PNG, atau PDF).', 422);
        }

        $data['bukti_file'] = $uploadedPath;

        $izin = $izinsTable->newEntity($data);
        if ($izinsTable->save($izin)) {
            return $this->jsonSuccess($izin->toArray(), 'Pengajuan izin berhasil dikirimkan!', 201);
        }

        $errors = $izin->getErrors();
        $firstErrorMessage = 'Gagal mengajukan izin.';
        if (!empty($errors)) {
            $messages = [];
            foreach ($errors as $field => $errList) {
                if (is_array($errList)) {
                    $messages[] = implode(', ', $errList);
                } else {
                    $messages[] = (string)$errList;
                }
            }
            $firstErrorMessage = implode('. ', $messages);
        }

        return $this->jsonError($firstErrorMessage, 422, $errors);
    }

    /**
     * Daftar Semua Izin dengan Filter (Fasil / Admin)
     * GET /api/izins/list
     *
     * Query params: status, jenis_izin, tanggal, search, page, limit
     */
    public function listAll(): Response
    {
        $user = $this->requireAuth(['fasil', 'admin']);
        if (!$user) {
            return $this->authErrorResponse;
        }

        $izinsTable = $this->fetchTable('Izins');
        $query = $izinsTable->find()
            ->contain(['Users' => ['Kamars' => ['Gedungs']]])
            ->orderBy(['Izins.created_at' => 'DESC']);

        $gedungInfo = null;

        // Scope gedung untuk fasilitator
        if ($user->role === 'fasil') {
            $gedung = $this->getFasilGedung($user);
            if (!$gedung) {
                return $this->authErrorResponse;
            }
            $gedungInfo = ['id' => $gedung->id, 'nama' => $gedung->nama];

            $penghuniIds = $this->getPenghuniUserIdsByGedung((int)$gedung->id);
            if (empty($penghuniIds)) {
                return $this->jsonSuccess([
                    'gedung' => $gedungInfo,
                    'total' => 0,
                    'data' => [],
                ]);
            }
            $query->where(['Izins.user_id IN' => $penghuniIds]);
        }

        // Filter: status
        $statusParam = trim((string)($this->request->getQuery('status') ?? ''));
        if ($statusParam !== '' && $statusParam !== 'Semua') {
            $query->where(['Izins.status' => $statusParam]);
        }

        // Filter: jenis_izin
        $jenisParam = trim((string)($this->request->getQuery('jenis_izin') ?? ''));
        if ($jenisParam !== '' && $jenisParam !== 'Semua') {
            $query->where(['Izins.jenis_izin' => $jenisParam]);
        }

        // Filter: tanggal pengajuan (created_at)
        $tanggalParam = trim((string)($this->request->getQuery('tanggal') ?? ''));
        if ($tanggalParam !== '') {
            $query->where(['DATE(Izins.created_at)' => $tanggalParam]);
        }

        // Filter: pencarian nama / NIM
        $search = trim((string)($this->request->getQuery('search') ?? ''));
        if ($search !== '') {
            $query->where([
                'OR' => [
                    'Users.nama LIKE' => '%' . $search . '%',
                    'Users.nim LIKE' => '%' . $search . '%',
                ],
            ]);
        }

        $results = $query->all();

        $data = [];
        foreach ($results as $izin) {
            $data[] = $this->formatIzin($izin);
        }

        return $this->jsonSuccess([
            'gedung' => $gedungInfo,
            'total' => count($data),
            'data' => $data,
        ]);
    }

    /**
     * Detail Pengajuan Izin
     * GET /api/izins/{id}
     */
    public function detail(string $id): Response
    {
        $user = $this->requireAuth(['fasil', 'admin']);
        if (!$user) {
            return $this->authErrorResponse;
        }

        $izinsTable = $this->fetchTable('Izins');
        $izin = $izinsTable->find()
            ->where(['Izins.id' => $id])
            ->contain(['Users' => ['Kamars' => ['Gedungs']]])
            ->first();

        if (!$izin) {
            return $this->jsonError('Pengajuan izin tidak ditemukan.', 404);
        }

        // Scope gedung fasilitator
        if ($user->role === 'fasil') {
            $gedung = $this->getFasilGedung($user);
            if (!$gedung) {
                return $this->authErrorResponse;
            }
            $userGedungId = $izin->user?->kamar?->gedung_id;
            if ((int)$userGedungId !== (int)$gedung->id) {
                return $this->jsonError(
                    'Akses ditolak. Pengajuan ini bukan milik penghuni di gedung binaan Anda.',
                    403
                );
            }
        }

        return $this->jsonSuccess($this->formatIzin($izin));
    }

    /**
     * Helper: Format data izin ke array terstandar.
     */
    private function formatIzin(object $izin): array
    {
        $tglMulai = ($izin->tanggal_mulai instanceof \DateTimeInterface)
            ? $izin->tanggal_mulai->format('Y-m-d')
            : (string)$izin->tanggal_mulai;

        $tglSelesai = ($izin->tanggal_selesai instanceof \DateTimeInterface)
            ? $izin->tanggal_selesai->format('Y-m-d')
            : (string)$izin->tanggal_selesai;

        $createdAt = ($izin->created_at instanceof \DateTimeInterface)
            ? $izin->created_at->format('Y-m-d H:i:s')
            : (string)$izin->created_at;

        $buktiFile = $izin->bukti_file ?? null;
        $buktiUrl  = null;
        if (!empty($buktiFile)) {
            $buktiUrl = str_starts_with((string)$buktiFile, 'http')
                ? (string)$buktiFile
                : '/' . ltrim((string)$buktiFile, '/');
        }

        $ext = '';
        if (!empty($buktiFile)) {
            $ext = strtolower(pathinfo((string)$buktiFile, PATHINFO_EXTENSION));
        }

        return [
            'id'             => $izin->id,
            'user_id'        => $izin->user_id,
            'nama'           => $izin->user?->nama ?? '-',
            'nim'            => $izin->user?->nim ?? '-',
            'email'          => $izin->user?->email ?? '-',
            'kamar'          => $izin->user?->kamar?->nomor_kamar ?? '-',
            'kamar_id'       => $izin->user?->kamar_id ?? null,
            'gedung'         => $izin->user?->kamar?->gedung?->nama ?? '-',
            'jenis_izin'     => $izin->jenis_izin,
            'tanggal_mulai'  => $tglMulai,
            'tanggal_selesai'=> $tglSelesai,
            'periode'        => $tglMulai . ' s/d ' . $tglSelesai,
            'keterangan'     => $izin->keterangan,
            'bukti_file'     => $buktiFile,
            'bukti_url'      => $buktiUrl,
            'bukti_ext'      => $ext,
            'status'         => $izin->status,
            'catatan_fasil'  => $izin->catatan_fasil ?? '',
            'disetujui_oleh' => $izin->disetujui_oleh ?? null,
            'created_at'     => $createdAt,
        ];
    }

    /**
     * Daftar Izin Pending (Fasil)
     * GET /api/izins/pending
     */
    public function pending(): Response
    {
        $user = $this->requireAuth(['fasil', 'admin']);
        if (!$user) {
            return $this->authErrorResponse;
        }

        $izinsTable = $this->fetchTable('Izins');
        $query = $izinsTable->find()
            ->where(['Izins.status' => 'pending'])
            ->contain(['Users' => ['Kamars' => ['Gedungs']]])
            ->orderBy(['Izins.created_at' => 'ASC']);

        // Jika fasilitator, batasi hanya izin dari penghuni gedung binaannya
        if ($user->role === 'fasil') {
            $gedung = $this->getFasilGedung($user);
            if (!$gedung) {
                return $this->authErrorResponse;
            }

            $penghuniIds = $this->getPenghuniUserIdsByGedung((int)$gedung->id);
            if (empty($penghuniIds)) {
                return $this->jsonSuccess([]);
            }

            $query->where(['Izins.user_id IN' => $penghuniIds]);
        }

        $list = $query->all();

        $data = [];
        foreach ($list as $izin) {
            $data[] = $this->formatIzin($izin);
        }

        return $this->jsonSuccess($data);
    }

    /**
     * Verifikasi Izin (Fasil)
     * POST /api/izins/:id/verify
     */
    public function verify(string $id): Response
    {
        $this->request->allowMethod(['post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
        $user = $this->requireAuth(['fasil', 'admin']);
        if (!$user) {
            return $this->authErrorResponse;
        }

        $izinsTable = $this->fetchTable('Izins');
        $izin = $izinsTable->find()
            ->where(['Izins.id' => $id])
            ->contain(['Users' => ['Kamars']])
            ->first();

        if (!$izin) {
            return $this->jsonError('Pengajuan izin tidak ditemukan.', 404);
        }

        // Izin harus masih berstatus pending dan verifikasi kedua harus ditolak
        if ($izin->status !== 'pending') {
            return $this->jsonError(
                "Pengajuan izin ini sudah diverifikasi sebelumnya dengan status: {$izin->status}.",
                422
            );
        }

        // Fasilitator hanya dapat menyetujui atau menolak izin penghuni di gedung binaannya
        if ($user->role === 'fasil') {
            $gedung = $this->getFasilGedung($user);
            if (!$gedung) {
                return $this->authErrorResponse;
            }

            $penghuniGedungId = ($izin->user && $izin->user->kamar) ? (int)$izin->user->kamar->gedung_id : null;
            if ($penghuniGedungId !== (int)$gedung->id) {
                return $this->jsonError(
                    'Akses ditolak. Pengajuan izin ini bukan milik penghuni di gedung binaan Anda.',
                    403
                );
            }
        }

        $data = $this->request->getData();
        $status = strtolower(trim((string)($data['status'] ?? '')));

        if (in_array($status, ['approved', 'disetujui', 'setuju'], true)) {
            $status = 'disetujui';
        } elseif (in_array($status, ['rejected', 'ditolak', 'tolak'], true)) {
            $status = 'ditolak';
        } else {
            return $this->jsonError(
                'Status verifikasi tidak valid. Gunakan "disetujui" atau "ditolak".',
                422
            );
        }

        $catatan = trim((string)($data['catatan'] ?? $data['catatan_fasil'] ?? ''));
        if ($status === 'ditolak' && $catatan === '') {
            return $this->jsonError(
                'Alasan penolakan wajib diisi saat menolak permohonan izin.',
                422
            );
        }

        $izin->status = $status;
        $izin->catatan_fasil = $catatan;
        $izin->disetujui_oleh = $user->id;

        if ($izinsTable->save($izin)) {
            if ($status === 'disetujui') {
                $this->syncPermitAttendance($izin);
            } else {
                $this->removePermitAttendance($izin);
            }

            return $this->jsonSuccess(
                $izin->toArray(),
                "Pengajuan izin berhasil di-$status."
            );
        }

        return $this->jsonError('Gagal memverifikasi izin.', 500, $izin->getErrors());
    }

    /**
     * Batalkan Pengajuan Izin (Penghuni)
     * DELETE /api/izins/:id
     */
    public function cancel(string $id): Response
    {
        $this->request->allowMethod(['delete', 'post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }

        $izinsTable = $this->fetchTable('Izins');
        $izin = $izinsTable->find()
            ->where(['Izins.id' => $id, 'Izins.user_id' => $user->id])
            ->first();

        if ($izin === null) {
            return $this->jsonError('Data pengajuan izin tidak ditemukan.', 404);
        }

        if ($izin->status !== 'pending') {
            return $this->jsonError('Izin yang sudah diverifikasi tidak dapat dibatalkan.', 422);
        }

        if ($izinsTable->delete($izin)) {
            return $this->jsonSuccess([], 'Pengajuan izin berhasil dibatalkan.');
        }

        return $this->jsonError('Gagal membatalkan pengajuan izin.', 500);
    }

    private function syncPermitAttendance(object $izin): void
    {
        $presensisTable = $this->fetchTable('Presensis');
        $startStr = is_object($izin->tanggal_mulai) && method_exists($izin->tanggal_mulai, 'format')
            ? $izin->tanggal_mulai->format('Y-m-d')
            : substr((string)$izin->tanggal_mulai, 0, 10);
        $endStr = is_object($izin->tanggal_selesai) && method_exists($izin->tanggal_selesai, 'format')
            ? $izin->tanggal_selesai->format('Y-m-d')
            : substr((string)$izin->tanggal_selesai, 0, 10);

        $sessions = ($izin->sesi === 'subuh' || $izin->sesi === 'malam')
            ? [$izin->sesi]
            : ['subuh', 'malam'];

        $current = new \DateTimeImmutable($startStr);
        $end = new \DateTimeImmutable($endStr);

        while ($current <= $end) {
            $dateStr = $current->format('Y-m-d');
            foreach ($sessions as $sesi) {
                $existing = $presensisTable->find()
                    ->where([
                        'user_id' => $izin->user_id,
                        'tanggal' => $dateStr,
                        'sesi' => $sesi,
                    ])
                    ->first();
                if ($existing === null) {
                    $entity = $presensisTable->newEntity([
                        'user_id' => $izin->user_id,
                        'tanggal' => $dateStr,
                        'waktu' => '00:00:00',
                        'sesi' => $sesi,
                        'status' => 'izin',
                        'keterangan' => 'Izin disetujui: ' . ($izin->keterangan ?: $izin->jenis_izin),
                    ]);
                    $presensisTable->save($entity);
                } elseif (in_array(strtolower((string)$existing->status), ['alpa', 'alfa'], true)) {
                    $existing->status = 'izin';
                    $existing->keterangan = 'Izin disetujui: ' . ($izin->keterangan ?: $izin->jenis_izin);
                    $presensisTable->save($existing);
                }
            }
            $current = $current->modify('+1 day');
        }
    }

    /**
     * @return array{jam_subuh_selesai: string, jam_malam_selesai: string, subuh_selesai_min: int, malam_selesai_min: int}
     */
    private function scheduleEndTimes(): array
    {
        $subuhEnd = '06:00';
        $malamEnd = '20:30';
        try {
            $record = $this->fetchTable('PengaturanPresensi')->find()->orderBy(['id' => 'ASC'])->first();
            if ($record !== null) {
                $fmt = static function (mixed $val, string $fallback): string {
                    if (is_object($val) && method_exists($val, 'format')) {
                        return (string)$val->format('H:i');
                    }
                    if (preg_match('/\A([01]\d|2[0-3]):([0-5]\d)/', str_replace('.', ':', (string)$val), $m)) {
                        return $m[1] . ':' . $m[2];
                    }

                    return $fallback;
                };
                $subuhEnd = $fmt($record->jam_subuh_selesai, $subuhEnd);
                $malamEnd = $fmt($record->jam_malam_selesai, $malamEnd);
            }
        } catch (\Throwable) {
        }

        $toMin = static function (string $hhmm): int {
            [$h, $m] = array_map('intval', explode(':', $hhmm));

            return ($h * 60) + $m;
        };

        return [
            'jam_subuh_selesai' => $subuhEnd,
            'jam_malam_selesai' => $malamEnd,
            'subuh_selesai_min' => $toMin($subuhEnd),
            'malam_selesai_min' => $toMin($malamEnd),
        ];
    }

    private function removePermitAttendance(object $izin): void
    {
        $presensisTable = $this->fetchTable('Presensis');
        $startStr = is_object($izin->tanggal_mulai) && method_exists($izin->tanggal_mulai, 'format')
            ? $izin->tanggal_mulai->format('Y-m-d')
            : substr((string)$izin->tanggal_mulai, 0, 10);
        $endStr = is_object($izin->tanggal_selesai) && method_exists($izin->tanggal_selesai, 'format')
            ? $izin->tanggal_selesai->format('Y-m-d')
            : substr((string)$izin->tanggal_selesai, 0, 10);

        $conditions = [
            'user_id' => $izin->user_id,
            'status' => 'izin',
            'tanggal >=' => $startStr,
            'tanggal <=' => $endStr,
        ];
        if ($izin->sesi === 'subuh' || $izin->sesi === 'malam') {
            $conditions['sesi'] = $izin->sesi;
        }
        $presensisTable->deleteAll($conditions);
    }
}
