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

        // Periksa apakah ada izin yang disetujui untuk sesi hari ini
        $izinsTable = $this->fetchTable('Izins');
        $approvedIzins = $izinsTable->find()
            ->where([
                'user_id' => $userId,
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
            'malam' => $malamData
        ]);
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
}
