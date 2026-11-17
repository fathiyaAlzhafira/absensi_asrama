<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Http\Response;

class LantaisController extends ApiController
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

        $query = $this->fetchTable('Lantais')->find()->contain(['Gedungs']);
        $buildingId = $this->request->getQuery('gedung_id');
        if ($buildingId !== null) {
            $buildingId = filter_var($buildingId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($buildingId === false) {
                return $this->jsonError('gedung_id filter tidak valid.', 422);
            }
            $query->where(['Lantais.gedung_id' => $buildingId]);
        }

        $floors = $query
            ->orderBy(['Lantais.gedung_id' => 'ASC', 'Lantais.nomor_lantai' => 'ASC'])
            ->all()
            ->map(fn($floor): array => $this->serializeFloor($floor))
            ->toList();

        return $this->jsonSuccess($floors);
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

        $data = $this->prepareData($this->request->getData(), true);
        if ($data instanceof Response) {
            return $data;
        }
        $building = $this->fetchTable('Gedungs')->find()
            ->where(['Gedungs.id' => $data['gedung_id']])->first();
        if ($building === null || !$building->is_active) {
            return $this->jsonError('Gedung tidak ditemukan atau sedang tidak aktif.', 422);
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $data['created_at'] = $now;
        $data['updated_at'] = $now;
        $table = $this->fetchTable('Lantais');
        $floor = $table->newEntity($data);
        if (!$table->save($floor)) {
            $message = isset($floor->getErrors()['nomor_lantai']['_isUnique'])
                ? 'Nomor lantai sudah ada di gedung ini.'
                : 'Lantai gagal ditambahkan.';
            return $this->jsonError($message, 422, $floor->getErrors());
        }
        $floor = $table->find()->where(['Lantais.id' => $floor->id])->contain(['Gedungs'])->first();

        return $this->jsonSuccess($this->serializeFloor($floor), 'Lantai berhasil ditambahkan.', 201);
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

        $table = $this->fetchTable('Lantais');
        $floor = $table->find()->where(['Lantais.id' => $id])->contain(['Gedungs'])->first();
        if ($floor === null) {
            return $this->jsonError('Lantai tidak ditemukan.', 404);
        }
        $data = $this->prepareData($this->request->getData(), false);
        if ($data instanceof Response) {
            return $data;
        }
        // Lantai tidak dapat dipindah ke gedung lain.
        unset($data['gedung_id']);
        $oldNumber = (int)$floor->nomor_lantai;
        $floor = $table->patchEntity($floor, $data);
        $floor->updated_at = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $rooms = $this->fetchTable('Kamars');
        $saved = $table->getConnection()->transactional(function () use ($table, $floor, $rooms, $oldNumber): bool {
            if (!$table->save($floor)) {
                return false;
            }
            if ((int)$floor->nomor_lantai !== $oldNumber) {
                $rooms->updateAll(
                    ['lantai' => (int)$floor->nomor_lantai],
                    ['gedung_id' => $floor->gedung_id, 'lantai' => $oldNumber]
                );
            }

            return true;
        });
        if (!$saved) {
            $message = isset($floor->getErrors()['nomor_lantai']['_isUnique'])
                ? 'Nomor lantai sudah ada di gedung ini.'
                : 'Lantai gagal diperbarui.';
            return $this->jsonError($message, 422, $floor->getErrors());
        }
        $floor = $table->find()->where(['Lantais.id' => $floor->id])->contain(['Gedungs'])->first();

        return $this->jsonSuccess($this->serializeFloor($floor), 'Lantai berhasil diperbarui.');
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

        $table = $this->fetchTable('Lantais');
        $floor = $table->find()->where(['Lantais.id' => $id])->first();
        if ($floor === null) {
            return $this->jsonError('Lantai tidak ditemukan.', 404);
        }
        if ($this->fetchTable('Kamars')->exists([
            'gedung_id' => $floor->gedung_id,
            'lantai' => $floor->nomor_lantai,
        ])) {
            return $this->jsonError('Lantai tidak dapat dihapus karena masih memiliki kamar.', 409);
        }
        if (!$table->delete($floor)) {
            return $this->jsonError('Lantai gagal dihapus.', 409);
        }

        return $this->jsonSuccess([], 'Lantai berhasil dihapus.');
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>|Response
     */
    private function prepareData(array $data, bool $creating): array|Response
    {
        $prepared = array_intersect_key($data, array_flip(['gedung_id', 'nomor_lantai', 'nama']));
        if ($creating || array_key_exists('gedung_id', $prepared)) {
            $buildingId = filter_var($prepared['gedung_id'] ?? null, FILTER_VALIDATE_INT, [
                'options' => ['min_range' => 1],
            ]);
            if ($buildingId === false) {
                return $this->jsonError('gedung_id wajib berupa ID gedung yang valid.', 422);
            }
            $prepared['gedung_id'] = $buildingId;
        }
        if ($creating || array_key_exists('nomor_lantai', $prepared)) {
            $floorNumber = filter_var($prepared['nomor_lantai'] ?? null, FILTER_VALIDATE_INT, [
                'options' => ['min_range' => 0, 'max_range' => 200],
            ]);
            if ($floorNumber === false) {
                return $this->jsonError('nomor_lantai harus berupa bilangan bulat 0–200.', 422);
            }
            $prepared['nomor_lantai'] = $floorNumber;
        }
        if (array_key_exists('nama', $prepared)) {
            if ($prepared['nama'] !== null && !is_string($prepared['nama'])) {
                return $this->jsonError('nama lantai harus berupa teks.', 422);
            }
            $prepared['nama'] = trim((string)$prepared['nama']) ?: null;
            if ($prepared['nama'] !== null && mb_strlen($prepared['nama']) > 80) {
                return $this->jsonError('nama lantai maksimal 80 karakter.', 422);
            }
        }

        return $prepared;
    }

    /**
     * @param \App\Model\Entity\Lantai $floor
     * @return array<string, mixed>
     */
    private function serializeFloor($floor): array
    {
        $roomCount = $this->fetchTable('Kamars')->find()
            ->where([
                'Kamars.gedung_id' => $floor->gedung_id,
                'Kamars.lantai' => $floor->nomor_lantai,
            ])
            ->count();

        return [
            'id' => $floor->id,
            'gedung_id' => $floor->gedung_id,
            'gedung_nama' => $floor->gedung?->nama,
            'nomor_lantai' => $floor->nomor_lantai,
            'nama' => $floor->nama,
            'jumlah_kamar' => $roomCount,
        ];
    }
}
