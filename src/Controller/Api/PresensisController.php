<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Http\Response;
use Cake\I18n\Date;
use Cake\I18n\Time;

class PresensisController extends ApiController
{
    /**
     * Riwayat Presensi Pengguna
     * GET /api/presensis/my-history
     */
    public function myHistory(): Response
    {
        $userId = $this->getAuthUserId();
        $presensisTable = $this->fetchTable('Presensis');

        $list = $presensisTable->find()
            ->where(['Presensis.user_id' => $userId])
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
        $userId = $this->getAuthUserId();
        $presensisTable = $this->fetchTable('Presensis');
        $today = date('Y-m-d');

        $subuh = $presensisTable->find()
            ->where(['user_id' => $userId, 'tanggal' => $today, 'sesi' => 'subuh'])
            ->first();

        $malam = $presensisTable->find()
            ->where(['user_id' => $userId, 'tanggal' => $today, 'sesi' => 'malam'])
            ->first();

        return $this->jsonSuccess([
            'today' => $today,
            'subuh' => $subuh ? ['status' => $subuh->status, 'waktu' => $subuh->waktu->format('H:i')] : null,
            'malam' => $malam ? ['status' => $malam->status, 'waktu' => $malam->waktu->format('H:i')] : null
        ]);
    }

    /**
     * Rekap presensi untuk gedung binaan fasil
     * GET /api/presensis/report
     */
    public function report(): Response
    {
        $this->request->allowMethod(['get', 'options']);

        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $fasilId = $this->getFasilUserId();
        if ($fasilId === null) {
            return $this->jsonError('Autentikasi fasil diperlukan.', 401);
        }

        $usersTable = $this->fetchTable('Users');
        $fasil = $usersTable->find()
            ->where(['Users.id' => $fasilId, 'Users.role' => 'fasil'])
            ->first();
        if (!$fasil) {
            return $this->jsonError('Akses laporan hanya tersedia untuk fasil.', 403);
        }

        $gedungsTable = $this->fetchTable('Gedungs');
        $kamarsTable = $this->fetchTable('Kamars');
        $gedungs = $gedungsTable->find()
            ->where(['Gedungs.id_user' => $fasilId])
            ->order(['Gedungs.nama' => 'ASC'])
            ->all()
            ->toArray();
        $gedungIds = array_map(static fn($gedung): int => (int)$gedung->id, $gedungs);

        $startDate = (string)$this->request->getQuery('start_date', '');
        $endDate = (string)$this->request->getQuery('end_date', '');
        if (!$this->isValidReportDate($startDate) || !$this->isValidReportDate($endDate)) {
            return $this->jsonError('Rentang tanggal laporan tidak valid.', 422);
        }
        if ($startDate > $endDate) {
            return $this->jsonError('Tanggal mulai tidak boleh melewati tanggal akhir.', 422);
        }

        $selectedGedungId = (string)$this->request->getQuery('gedung_id', 'all');
        if ($selectedGedungId !== 'all') {
            $selectedGedungId = filter_var($selectedGedungId, FILTER_VALIDATE_INT);
            if ($selectedGedungId === false) {
                return $this->jsonError('Gedung yang dipilih tidak valid.', 422);
            }
            if (!in_array((int)$selectedGedungId, $gedungIds, true)) {
                return $this->jsonError('Anda tidak memiliki akses ke gedung tersebut.', 403);
            }
            $selectedGedungId = (string)$selectedGedungId;
        }

        $selectedKamarId = (string)$this->request->getQuery('kamar_id', 'all');
        if ($selectedKamarId !== 'all') {
            $selectedKamarId = filter_var($selectedKamarId, FILTER_VALIDATE_INT);
            if ($selectedKamarId === false) {
                return $this->jsonError('Kamar yang dipilih tidak valid.', 422);
            }

            $roomQuery = $kamarsTable->find()
                ->where([
                    'Kamars.id' => $selectedKamarId,
                    'Kamars.gedung_id IN' => $gedungIds,
                ]);
            if ($selectedGedungId !== 'all') {
                $roomQuery->where(['Kamars.gedung_id' => $selectedGedungId]);
            }
            if (!$roomQuery->first()) {
                return $this->jsonError('Kamar tersebut bukan bagian dari gedung binaan Anda.', 403);
            }
            $selectedKamarId = (string)$selectedKamarId;
        }

        $selectedSession = (string)$this->request->getQuery('sesi', 'all');
        if (!in_array($selectedSession, ['all', 'subuh', 'malam'], true)) {
            return $this->jsonError('Sesi presensi yang dipilih tidak valid.', 422);
        }

        $roomsQuery = $kamarsTable->find()
            ->where(['Kamars.gedung_id IN' => $gedungIds])
            ->order(['Kamars.nomor_kamar' => 'ASC']);
        $rooms = [];
        foreach ($roomsQuery->all() as $room) {
            $rooms[] = [
                'id' => (int)$room->id,
                'gedung_id' => (int)$room->gedung_id,
                'nomor_kamar' => $room->nomor_kamar,
            ];
        }

        $presensisTable = $this->fetchTable('Presensis');
        $query = $presensisTable->find()
            ->contain(['Users' => ['Kamars' => ['Gedungs']]])
            ->innerJoinWith('Users.Kamars.Gedungs', function ($query) use ($fasilId) {
                return $query->where(['Gedungs.id_user' => $fasilId]);
            })
            ->where([
                'Presensis.tanggal >=' => $startDate,
                'Presensis.tanggal <=' => $endDate,
                'Users.role' => 'penghuni',
            ])
            ->order([
                'Presensis.tanggal' => 'DESC',
                'Presensis.sesi' => 'ASC',
                'Users.nama' => 'ASC',
            ]);

        if ($selectedGedungId !== 'all') {
            $query->where(['Gedungs.id' => $selectedGedungId]);
        }
        if ($selectedKamarId !== 'all') {
            $query->where(['Kamars.id' => $selectedKamarId]);
        }
        if ($selectedSession !== 'all') {
            $query->where(['Presensis.sesi' => $selectedSession]);
        }

        $records = [];
        $summary = [
            'total' => 0,
            'hadir' => 0,
            'terlambat' => 0,
            'izin' => 0,
            'alpa' => 0,
        ];
        foreach ($query->all() as $record) {
            $gedung = $record->user->kamar->gedung;
            $records[] = [
                'id' => (int)$record->id,
                'tanggal' => $record->tanggal->format('Y-m-d'),
                'nama' => $record->user->nama,
                'nim' => $record->user->nim,
                'gedung_id' => (int)$gedung->id,
                'gedung' => $gedung->nama,
                'kamar_id' => (int)$record->user->kamar->id,
                'kamar' => $record->user->kamar->nomor_kamar,
                'sesi' => $record->sesi,
                'waktu' => $record->waktu->format('H:i:s'),
                'status' => $record->status,
            ];
            $summary['total']++;
            if (isset($summary[$record->status])) {
                $summary[$record->status]++;
            }
        }

        return $this->jsonSuccess([
            'filter' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'gedung_id' => $selectedGedungId,
                'kamar_id' => $selectedKamarId,
                'sesi' => $selectedSession,
            ],
            'gedungs' => array_map(static function ($gedung): array {
                return ['id' => (int)$gedung->id, 'nama' => $gedung->nama];
            }, $gedungs),
            'kamars' => $rooms,
            'records' => $records,
            'summary' => $summary,
        ], 'Laporan presensi berhasil dimuat.');
    }

    /**
     * Kirim Presensi
     * POST /api/presensis
     */
    public function add(): Response
    {
        $this->request->allowMethod(['post']);
        $userId = $this->getAuthUserId();
        $presensisTable = $this->fetchTable('Presensis');

        $data = $this->request->getData();
        $data['user_id'] = $userId;
        $data['tanggal'] = $data['tanggal'] ?? date('Y-m-d');
        $data['waktu'] = $data['waktu'] ?? date('H:i:s');

        $presensi = $presensisTable->newEntity($data);
        if ($presensisTable->save($presensi)) {
            return $this->jsonSuccess($presensi->toArray(), 'Presensi berhasil dicatat!', 201);
        }

        return $this->jsonError('Gagal mencatat presensi.', 422, $presensi->getErrors());
    }

    private function getFasilUserId(): ?int
    {
        $authHeader = $this->request->getHeaderLine('Authorization');
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }

        $token = trim($matches[1]);
        if ($token === 'offline_token_fasil') {
            return 2;
        }
        if (str_starts_with($token, 'offline_token_')) {
            return null;
        }

        $decoded = base64_decode($token, true);
        if ($decoded === false) {
            return null;
        }
        $userId = (int)explode(':', $decoded)[0];

        return $userId > 0 ? $userId : null;
    }

    private function isValidReportDate(string $date): bool
    {
        $parsed = \DateTimeImmutable::createFromFormat('!Y-m-d', $date);
        $errors = \DateTimeImmutable::getLastErrors();

        return $parsed !== false
            && $parsed->format('Y-m-d') === $date
            && ($errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0));
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
        return 4; // default Ahmad Fauzan jika belum ada token
    }
}
