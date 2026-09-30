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
