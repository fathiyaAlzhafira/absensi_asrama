<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Http\Response;

class KamarsController extends ApiController
{
    public function index(): Response
    {
        $this->request->allowMethod(['get', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
        $admin = $this->requireAdminUser();
        if ($admin instanceof Response) {
            return $admin;
        }

        $query = $this->fetchTable('Kamars')->find();
        $buildingId = $this->request->getQuery('gedung_id');
        if ($buildingId !== null) {
            $buildingId = filter_var($buildingId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($buildingId === false) {
                return $this->jsonError('gedung_id filter tidak valid.', 422);
            }
            $query->where(['Kamars.gedung_id' => $buildingId]);
        }
        $rooms = $query
            ->contain(['Gedungs', 'Users'])
            ->orderBy(['Gedungs.nama' => 'ASC', 'Kamars.lantai' => 'ASC', 'Kamars.nomor_kamar' => 'ASC'])
            ->all()
            ->map(fn($room): array => $this->serializeRoom($room))
            ->toList();

        return $this->jsonSuccess($rooms);
    }

    public function add(): Response
    {
        $this->request->allowMethod(['post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
        $admin = $this->requireAdminUser();
        if ($admin instanceof Response) {
            return $admin;
        }

        $prepared = $this->prepareRoomData($this->request->getData(), true);
        if ($prepared instanceof Response) {
            return $prepared;
        }
        $table = $this->fetchTable('Kamars');
        $timestamp = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $prepared['created_at'] = $timestamp;
        $prepared['updated_at'] = $timestamp;
        $room = $table->newEntity($prepared);
        $saved = $table->getConnection()->transactional(function () use ($table, $room): bool {
            return $this->ensureFloor((int)$room->gedung_id, (int)$room->lantai) && (bool)$table->save($room);
        });
        if (!$saved) {
            return $this->jsonError($this->firstError($room->getErrors(), 'Gagal menambahkan kamar.'), 422, $room->getErrors());
        }
        $room = $table->find()->where(['Kamars.id' => $room->id])->contain(['Gedungs', 'Users'])->first();

        return $this->jsonSuccess($this->serializeRoom($room), 'Kamar berhasil ditambahkan.', 201);
    }

    public function edit(string $id): Response
    {
        $this->request->allowMethod(['put', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
        $admin = $this->requireAdminUser();
        if ($admin instanceof Response) {
            return $admin;
        }

        $table = $this->fetchTable('Kamars');
        $room = $table->find()->where(['Kamars.id' => $id])->first();
        if ($room === null) {
            return $this->jsonError('Kamar tidak ditemukan.', 404);
        }
        $prepared = $this->prepareRoomData($this->request->getData(), false, (int)$room->gedung_id);
        if ($prepared instanceof Response) {
            return $prepared;
        }
        $nextCapacity = $prepared['kapasitas'] ?? (int)$room->kapasitas;
        if ($nextCapacity < (int)$this->fetchTable('Users')->find()
            ->where(['Users.kamar_id' => $room->id, 'Users.role' => 'penghuni'])
            ->count()) {
            return $this->jsonError('Kapasitas kamar tidak boleh lebih kecil dari jumlah penghuni saat ini.', 409);
        }
        $room = $table->patchEntity($room, $prepared);
        $room->updated_at = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $saved = $table->getConnection()->transactional(function () use ($table, $room): bool {
            return $this->ensureFloor((int)$room->gedung_id, (int)$room->lantai) && (bool)$table->save($room);
        });
        if (!$saved) {
            return $this->jsonError($this->firstError($room->getErrors(), 'Gagal memperbarui kamar.'), 422, $room->getErrors());
        }
        $room = $table->find()->where(['Kamars.id' => $room->id])->contain(['Gedungs', 'Users'])->first();

        return $this->jsonSuccess($this->serializeRoom($room), 'Kamar berhasil diperbarui.');
    }

    public function delete(string $id): Response
    {
        $this->request->allowMethod(['delete', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
        $admin = $this->requireAdminUser();
        if ($admin instanceof Response) {
            return $admin;
        }

        $table = $this->fetchTable('Kamars');
        $room = $table->find()->where(['Kamars.id' => $id])->first();
        if ($room === null) {
            return $this->jsonError('Kamar tidak ditemukan.', 404);
        }
        $assignedUsers = $this->fetchTable('Users')->exists([
            'kamar_id' => $room->id,
        ]);
        if ($assignedUsers) {
            return $this->jsonError('Kamar tidak dapat dihapus karena masih memiliki pengguna yang ditugaskan.', 409);
        }
        if (!$table->delete($room)) {
            return $this->jsonError('Kamar gagal dihapus.', 409);
        }

        return $this->jsonSuccess([], 'Kamar berhasil dihapus.');
    }

    /**
     * Pastikan lantai kamar tercatat pada tabel lantais milik gedung yang sama.
     */
    private function ensureFloor(int $buildingId, int $floorNumber): bool
    {
        $floors = $this->fetchTable('Lantais');
        if ($floors->exists(['gedung_id' => $buildingId, 'nomor_lantai' => $floorNumber])) {
            return true;
        }
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $floor = $floors->newEntity([
            'gedung_id' => $buildingId,
            'nomor_lantai' => $floorNumber,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return (bool)$floors->save($floor);
    }

    /**
     * @param array<string, mixed> $errors
     */
    private function firstError(array $errors, string $fallback): string
    {
        if (isset($errors['nomor_kamar']['_isUnique'])) {
            return 'Nomor kamar sudah dipakai di gedung ini.';
        }
        foreach ($errors as $fieldErrors) {
            foreach ((array)$fieldErrors as $message) {
                if (is_string($message)) {
                    return $message;
                }
            }
        }

        return $fallback;
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>|Response
     */
    private function prepareRoomData(array $data, bool $creating, ?int $currentBuildingId = null): array|Response
    {
        $prepared = array_intersect_key($data, array_flip(['gedung_id', 'nomor_kamar', 'lantai', 'kapasitas']));
        if (array_key_exists('gedung_id', $prepared)) {
            $buildingId = filter_var($prepared['gedung_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($buildingId === false) {
                return $this->jsonError('gedung_id wajib berupa ID gedung yang valid.', 422);
            }
            $building = $this->fetchTable('Gedungs')->find()->where(['Gedungs.id' => $buildingId])->first();
            if ($building === null || (!$building->is_active && $buildingId !== $currentBuildingId)) {
                return $this->jsonError('Gedung tidak ditemukan atau sedang tidak aktif.', 422);
            }
            $prepared['gedung_id'] = $buildingId;
        } elseif ($creating) {
            return $this->jsonError('gedung_id wajib diisi.', 422);
        }

        if (array_key_exists('nomor_kamar', $prepared)) {
            if (!is_string($prepared['nomor_kamar']) || trim($prepared['nomor_kamar']) === ''
                || mb_strlen(trim($prepared['nomor_kamar'])) > 20) {
                return $this->jsonError('nomor_kamar wajib berupa teks dengan panjang 1–20 karakter.', 422);
            }
            $prepared['nomor_kamar'] = trim($prepared['nomor_kamar']);
        } elseif ($creating) {
            return $this->jsonError('nomor_kamar wajib diisi.', 422);
        }

        foreach (['lantai' => [0, 200], 'kapasitas' => [1, 100]] as $field => [$minimum, $maximum]) {
            if (!array_key_exists($field, $prepared)) {
                if ($creating) {
                    $prepared[$field] = $field === 'lantai' ? 1 : 4;
                }
                continue;
            }
            $value = filter_var($prepared[$field], FILTER_VALIDATE_INT, ['options' => [
                'min_range' => $minimum,
                'max_range' => $maximum,
            ]]);
            if ($value === false) {
                return $this->jsonError($field . ' berada di luar rentang yang diizinkan.', 422);
            }
            $prepared[$field] = $value;
        }

        return $prepared;
    }

    /**
     * @param \App\Model\Entity\Kamar $room
     * @return array<string, mixed>
     */
    private function serializeRoom($room): array
    {
        $occupants = 0;
        foreach ($room->users ?? [] as $resident) {
            if ($resident->role === 'penghuni') {
                $occupants++;
            }
        }

        return [
            'id' => $room->id,
            'gedung_id' => $room->gedung_id,
            'gedung_nama' => $room->gedung ? $room->gedung->nama : null,
            'nomor_kamar' => $room->nomor_kamar,
            'lantai' => $room->lantai,
            'kapasitas' => $room->kapasitas,
            'jumlah_penghuni' => $occupants,
        ];
    }
}
