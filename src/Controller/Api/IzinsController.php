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
        $userId = $this->getAuthUserId();
        $izinsTable = $this->fetchTable('Izins');

        $list = $izinsTable->find()
            ->where(['Izins.user_id' => $userId])
            ->order(['Izins.created_at' => 'DESC'])
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
        $userId = $this->getAuthUserId();
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
     * Daftar Izin Pending (Fasil)
     * GET /api/izins/pending
     */
    public function pending(): Response
    {
        $izinsTable = $this->fetchTable('Izins');
        $list = $izinsTable->find()
            ->where(['Izins.status' => 'pending'])
            ->contain(['Users' => ['Kamars']])
            ->order(['Izins.created_at' => 'ASC'])
            ->all();

        return $this->jsonSuccess($list->toArray());
    }

    /**
     * Verifikasi Izin (Fasil)
     * POST /api/izins/:id/verify
     */
    public function verify(string $id): Response
    {
        $this->request->allowMethod(['post']);
        $izinsTable = $this->fetchTable('Izins');
        $fasilId = $this->getAuthUserId();

        $data = $this->request->getData();
        $status = $data['status'] ?? 'disetujui';
        $catatan = $data['catatan'] ?? '';

        $izin = $izinsTable->get($id);
        $izin->status = $status;
        $izin->catatan_fasil = $catatan;
        $izin->disetujui_oleh = $fasilId;

        if ($izinsTable->save($izin)) {
            return $this->jsonSuccess($izin->toArray(), "Izin berhasil di-$status.");
        }

        return $this->jsonError('Gagal memverifikasi izin.', 422);
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
