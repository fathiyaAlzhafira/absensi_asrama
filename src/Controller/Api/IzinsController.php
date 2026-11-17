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

        $today = date('Y-m-d');
        if ($data['tanggal_mulai'] < $today) {
            return $this->jsonError('Tidak dapat mengajukan izin pada tanggal yang sudah lampau.', 422);
        }

        if (strtotime((string)$data['tanggal_selesai']) < strtotime((string)$data['tanggal_mulai'])) {
            return $this->jsonError('Tanggal selesai izin tidak boleh lebih awal dari tanggal mulai izin.', 422);
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
     * Daftar Izin Pending (Fasil)
     * GET /api/izins/pending
     */
    public function pending(): Response
    {
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }
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
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }
        $izinsTable = $this->fetchTable('Izins');

        $data = $this->request->getData();
        $status = $data['status'] ?? 'disetujui';
        $catatan = $data['catatan'] ?? '';

        $izin = $izinsTable->get($id);
        $izin->status = $status;
        $izin->catatan_fasil = $catatan;
        $izin->disetujui_oleh = $user->id;

        if ($izinsTable->save($izin)) {
            return $this->jsonSuccess($izin->toArray(), "Izin berhasil di-$status.");
        }

        return $this->jsonError('Gagal memverifikasi izin.', 422);
    }
}
