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
        $user = $this->requireAuth();
        if (!$user) {
            return $this->authErrorResponse;
        }

        $userId = $user->id;
        $izinsTable = $this->fetchTable('Izins');

        $list = $izinsTable->find()
            ->where(['Izins.user_id' => $userId])
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
        $this->request->allowMethod(['post']);
        $user = $this->requireAuth();
        if (!$user) {
            return $this->authErrorResponse;
        }

        $userId = $user->id;
        $izinsTable = $this->fetchTable('Izins');

        $data = $this->request->getData();
        $data['user_id'] = $userId;
        $data['status'] = 'pending';

        // Tangani upload file jika ada
        $file = $this->request->getData('bukti_file');
        if ($file && is_object($file) && method_exists($file, 'getClientFilename')) {
            $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientFilename());
            $targetPath = WWW_ROOT . 'uploads' . DS . 'izin' . DS . $filename;
            
            if (!is_dir(WWW_ROOT . 'uploads' . DS . 'izin')) {
                mkdir(WWW_ROOT . 'uploads' . DS . 'izin', 0777, true);
            }
            $file->moveTo($targetPath);
            $data['bukti_file'] = 'uploads/izin/' . $filename;
        } elseif (empty($data['bukti_file'])) {
            $data['bukti_file'] = 'uploads/izin/sample_bukti.pdf';
        }

        $izin = $izinsTable->newEntity($data);
        if ($izinsTable->save($izin)) {
            return $this->jsonSuccess($izin->toArray(), 'Pengajuan izin berhasil dikirimkan!', 201);
        }

        return $this->jsonError('Gagal mengajukan izin.', 422, $izin->getErrors());
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
        $this->request->allowMethod(['post']);
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
            return $this->jsonSuccess(
                $izin->toArray(),
                "Pengajuan izin berhasil di-$status."
            );
        }

        return $this->jsonError('Gagal memverifikasi izin.', 500, $izin->getErrors());
    }

    private function getAuthUserId(): int
    {
        $authHeader = $this->request->getHeaderLine('Authorization');
        if (!empty($authHeader) && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $decoded = base64_decode($matches[1]);
            $parts = explode(':', $decoded);
            if (!empty($parts[0])) {
                return (int)$parts[0];
            }
        }
        return 4;
    }
}
