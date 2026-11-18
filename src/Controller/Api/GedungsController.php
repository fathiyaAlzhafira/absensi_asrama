<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Utility\GeoJsonFence;
use Cake\Http\Response;
use InvalidArgumentException;
use JsonException;

class GedungsController extends ApiController
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

        $buildings = $this->fetchTable('Gedungs')->find()
            ->contain(['Supervisor', 'Lantais', 'Kamars' => ['Users']])
            ->orderBy(['Gedungs.nama' => 'ASC'])
            ->all()
            ->map(fn($building): array => $this->serializeBuilding($building))
            ->toList();

        return $this->jsonSuccess($buildings);
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

        $data = $this->request->getData();
        $prepared = $this->prepareBuildingData($data, true);
        if ($prepared instanceof Response) {
            return $prepared;
        }

        $table = $this->fetchTable('Gedungs');
        $isActive = $prepared['is_active'] ?? true;
        unset($prepared['is_active']);
        $timestamp = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $prepared['created_at'] = $timestamp;
        $prepared['updated_at'] = $timestamp;
        $building = $table->newEntity($prepared);
        $building->is_active = $isActive;
        $floorCount = filter_var($data['jumlah_lantai'] ?? 1, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1, 'max_range' => 50],
        ]);
        if ($floorCount === false) {
            return $this->jsonError('Jumlah lantai harus berupa bilangan bulat 1–50.', 422);
        }
        $floors = $this->fetchTable('Lantais');
        $saved = $table->getConnection()->transactional(function () use ($table, $building, $floors, $floorCount, $timestamp): bool {
            if (!$table->save($building)) {
                return false;
            }
            for ($number = 1; $number <= $floorCount; $number++) {
                $floor = $floors->newEntity([
                    'gedung_id' => $building->id,
                    'nomor_lantai' => $number,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ]);
                if (!$floors->save($floor)) {
                    return false;
                }
            }

            return true;
        });
        if (!$saved) {
            return $this->jsonError($this->buildingError($building->getErrors(), 'Gagal menambahkan gedung.'), 422, $building->getErrors());
        }

        $building = $table->find()->where(['Gedungs.id' => $building->id])
            ->contain(['Supervisor', 'Lantais', 'Kamars' => ['Users']])->first();
        return $this->jsonSuccess($this->serializeBuilding($building), 'Gedung berhasil ditambahkan.', 201);
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

        $table = $this->fetchTable('Gedungs');
        $building = $table->find()->where(['Gedungs.id' => $id])->first();
        if ($building === null) {
            return $this->jsonError('Gedung tidak ditemukan.', 404);
        }
        $prepared = $this->prepareBuildingData($this->request->getData(), false);
        if ($prepared instanceof Response) {
            return $prepared;
        }

        $isActive = $prepared['is_active'] ?? null;
        unset($prepared['is_active']);
        $nextIsActive = $isActive ?? (bool)$building->is_active;
        $nextGeometry = array_key_exists('geofence_geojson', $prepared)
            ? $prepared['geofence_geojson']
            : $building->geofence_geojson;
        if ($nextIsActive && empty($nextGeometry)) {
            return $this->jsonError('Gedung aktif wajib memiliki batas geofence.', 422);
        }
        $building = $table->patchEntity($building, $prepared);
        $building->updated_at = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        if ($isActive !== null) {
            $building->is_active = $isActive;
        }
        $data = $this->request->getData();
        $targetFloorCount = null;
        if (array_key_exists('jumlah_lantai', $data) && $data['jumlah_lantai'] !== '' && $data['jumlah_lantai'] !== null) {
            $targetFloorCount = filter_var($data['jumlah_lantai'], FILTER_VALIDATE_INT, [
                'options' => ['min_range' => 1, 'max_range' => 50],
            ]);
            if ($targetFloorCount === false) {
                return $this->jsonError('Jumlah lantai harus berupa bilangan bulat 1–50.', 422);
            }
        }

        if ($targetFloorCount !== null) {
            $occupiedFloorExceeds = $this->fetchTable('Kamars')->exists([
                'gedung_id' => $building->id,
                'lantai >' => $targetFloorCount,
            ]);
            if ($occupiedFloorExceeds) {
                return $this->jsonError(
                    'Jumlah lantai tidak dapat dikurangi karena masih ada kamar di lantai yang lebih tinggi.',
                    409
                );
            }
        }

        $floors = $this->fetchTable('Lantais');
        $saved = $table->getConnection()->transactional(function () use ($table, $building, $floors, $targetFloorCount): bool {
            if (!$table->save($building)) {
                return false;
            }
            if ($targetFloorCount !== null) {
                $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
                for ($number = 1; $number <= $targetFloorCount; $number++) {
                    if (!$floors->exists(['gedung_id' => $building->id, 'nomor_lantai' => $number])) {
                        $floor = $floors->newEntity([
                            'gedung_id' => $building->id,
                            'nomor_lantai' => $number,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                        if (!$floors->save($floor)) {
                            return false;
                        }
                    }
                }
                $floors->deleteAll([
                    'gedung_id' => $building->id,
                    'nomor_lantai >' => $targetFloorCount,
                ]);
            }

            return true;
        });
        if (!$saved) {
            return $this->jsonError($this->buildingError($building->getErrors(), 'Gagal memperbarui gedung.'), 422, $building->getErrors());
        }

        $building = $table->find()->where(['Gedungs.id' => $building->id])
            ->contain(['Supervisor', 'Lantais', 'Kamars' => ['Users']])->first();
        return $this->jsonSuccess($this->serializeBuilding($building), 'Gedung berhasil diperbarui.');
    }

    public function status(string $id): Response
    {
        $this->request->allowMethod(['patch', 'put', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
        $admin = $this->requireAdminUser();
        if ($admin instanceof Response) {
            return $admin;
        }

        $data = $this->request->getData();
        if (!array_key_exists('is_active', $data)
            || !in_array($data['is_active'], [true, false, 0, 1, '0', '1'], true)) {
            return $this->jsonError('is_active wajib berupa nilai boolean.', 422);
        }

        $table = $this->fetchTable('Gedungs');
        $building = $table->find()->where(['Gedungs.id' => $id])->first();
        if ($building === null) {
            return $this->jsonError('Gedung tidak ditemukan.', 404);
        }
        $isActive = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
        if ($isActive && empty($building->geofence_geojson)) {
            return $this->jsonError('Batas geofence wajib diatur sebelum gedung diaktifkan.', 422);
        }
        $building->is_active = $isActive;
        if (!$table->save($building)) {
            return $this->jsonError('Status gedung gagal diperbarui.', 422, $building->getErrors());
        }

        return $this->jsonSuccess(
            ['id' => $building->id, 'is_active' => (bool)$building->is_active],
            'Status gedung berhasil diperbarui.'
        );
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

        $table = $this->fetchTable('Gedungs');
        $building = $table->find()->where(['Gedungs.id' => $id])->first();
        if ($building === null) {
            return $this->jsonError('Gedung tidak ditemukan.', 404);
        }
        if ($this->fetchTable('Kamars')->exists(['gedung_id' => $building->id])) {
            return $this->jsonError(
                'Gedung tidak dapat dihapus karena masih memiliki kamar. Nonaktifkan gedung untuk mempertahankan datanya.',
                409
            );
        }
        if (!$table->delete($building)) {
            return $this->jsonError('Gedung gagal dihapus.', 409);
        }

        return $this->jsonSuccess([], 'Gedung berhasil dihapus.');
    }

    public function myAssignment(): Response
    {
        $this->request->allowMethod(['get', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }

        $resident = $this->fetchTable('Users')->find()->where(['Users.id' => $user->id])
            ->contain(['Kamars' => ['Gedungs']])->first();
        if ($resident === null || $resident->kamar === null || $resident->kamar->gedung === null) {
            return $this->jsonError('Penempatan gedung dan kamar belum tersedia.', 404);
        }

        try {
            $geometry = GeoJsonFence::parse((string)$resident->kamar->gedung->geofence_geojson);
        } catch (InvalidArgumentException $exception) {
            return $this->jsonError('Geofence penempatan belum dikonfigurasi dengan benar.', 422);
        }

        return $this->jsonSuccess([
            'gedung' => [
                'id' => $resident->kamar->gedung->id,
                'nama' => $resident->kamar->gedung->nama,
                'is_active' => (bool)$resident->kamar->gedung->is_active,
                'geofence_geojson' => $geometry,
            ],
            'kamar' => [
                'id' => $resident->kamar->id,
                'nomor_kamar' => $resident->kamar->nomor_kamar,
            ],
        ]);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>|Response
     */
    private function prepareBuildingData(array $data, bool $creating): array|Response
    {
        $allowed = [
            'nama', 'id_user', 'latitude', 'longitude', 'radius_meter', 'keterangan',
            'geofence_geojson', 'is_active',
        ];
        $prepared = array_intersect_key($data, array_flip($allowed));

        if (array_key_exists('is_active', $prepared)) {
            if (!in_array($prepared['is_active'], [true, false, 0, 1, '0', '1'], true)) {
                return $this->jsonError('is_active wajib berupa nilai boolean.', 422);
            }
            $prepared['is_active'] = filter_var($prepared['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        if (array_key_exists('nama', $prepared)) {
            if (!is_string($prepared['nama']) || trim($prepared['nama']) === '' || mb_strlen(trim($prepared['nama'])) > 100) {
                return $this->jsonError('nama wajib berupa teks dengan panjang 1–100 karakter.', 422);
            }
            $prepared['nama'] = trim($prepared['nama']);
        } elseif ($creating) {
            return $this->jsonError('nama wajib diisi.', 422);
        }

        if (array_key_exists('id_user', $prepared)) {
            if ($prepared['id_user'] === null || $prepared['id_user'] === '') {
                $prepared['id_user'] = null;
            } elseif (!filter_var($prepared['id_user'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]])
                || !$this->fetchTable('Users')->exists(['id' => $prepared['id_user'], 'role' => 'fasil'])) {
                return $this->jsonError('id_user harus menunjuk akun fasil yang valid.', 422);
            } else {
                $prepared['id_user'] = (int)$prepared['id_user'];
            }
        }

        foreach (['latitude', 'longitude'] as $coordinateField) {
            if (!array_key_exists($coordinateField, $prepared)) {
                continue;
            }
            if ($prepared[$coordinateField] === null || $prepared[$coordinateField] === '') {
                $prepared[$coordinateField] = null;
                continue;
            }
            if (!is_numeric($prepared[$coordinateField]) || !is_finite((float)$prepared[$coordinateField])) {
                return $this->jsonError($coordinateField . ' harus berupa koordinat numerik.', 422);
            }
            $limit = $coordinateField === 'latitude' ? 90 : 180;
            if ((float)$prepared[$coordinateField] < -$limit || (float)$prepared[$coordinateField] > $limit) {
                return $this->jsonError($coordinateField . ' berada di luar rentang koordinat.', 422);
            }
        }

        if (array_key_exists('radius_meter', $prepared)) {
            if (!filter_var($prepared['radius_meter'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 50000]])) {
                return $this->jsonError('radius_meter harus berupa bilangan bulat 1–50000.', 422);
            }
            $prepared['radius_meter'] = (int)$prepared['radius_meter'];
        }
        if (array_key_exists('keterangan', $prepared)
            && $prepared['keterangan'] !== null && !is_string($prepared['keterangan'])) {
            return $this->jsonError('keterangan harus berupa teks.', 422);
        }

        if (array_key_exists('geofence_geojson', $data)) {
            if ($data['geofence_geojson'] === null || $data['geofence_geojson'] === '') {
                if ($creating) {
                    return $this->jsonError('geofence_geojson wajib diisi.', 422);
                }
                $prepared['geofence_geojson'] = null;
            } elseif (!is_array($data['geofence_geojson']) && !is_string($data['geofence_geojson'])) {
                return $this->jsonError('geofence_geojson harus berupa objek GeoJSON atau teks JSON.', 422);
            } else {
                try {
                    $geometry = GeoJsonFence::parse($data['geofence_geojson']);
                    $prepared['geofence_geojson'] = json_encode($geometry, JSON_THROW_ON_ERROR);
                } catch (InvalidArgumentException|JsonException $exception) {
                    return $this->jsonError('geofence_geojson harus berisi geometri Polygon atau MultiPolygon yang valid.', 422);
                }
            }
        } elseif ($creating) {
            return $this->jsonError('geofence_geojson wajib diisi.', 422);
        }

        return $prepared;
    }

    /**
     * @param array<string, mixed> $errors
     */
    private function buildingError(array $errors, string $fallback): string
    {
        if (isset($errors['nama']['_isUnique'])) {
            return 'Nama gedung sudah digunakan.';
        }

        return $fallback;
    }

    /**
     * @param \App\Model\Entity\Gedung $building
     * @return array<string, mixed>
     */
    private function serializeBuilding($building): array
    {
        $roomCount = 0;
        $residentCount = 0;
        foreach ($building->kamars ?? [] as $room) {
            $roomCount++;
            foreach ($room->users ?? [] as $resident) {
                if ($resident->role === 'penghuni') {
                    $residentCount++;
                }
            }
        }

        $geometry = null;
        if (!empty($building->geofence_geojson)) {
            try {
                $geometry = GeoJsonFence::parse((string)$building->geofence_geojson);
            } catch (InvalidArgumentException $exception) {
                $geometry = null;
            }
        }

        $supervisor = $building->supervisor ? [
            'id' => $building->supervisor->id,
            'nama' => $building->supervisor->nama,
        ] : null;

        return [
            'id' => $building->id,
            'nama' => $building->nama,
            'id_user' => $building->id_user,
            'supervisor' => $supervisor,
            'fasil' => $supervisor,
            'is_active' => (bool)$building->is_active,
            'geofence_geojson' => $geometry,
            'latitude' => $building->latitude,
            'longitude' => $building->longitude,
            'radius_meter' => $building->radius_meter,
            'keterangan' => $building->keterangan,
            'jumlah_kamar' => $roomCount,
            'jumlah_penghuni' => $residentCount,
            'jumlah_lantai' => count($building->lantais ?? []),
            'lantais' => array_map(fn($floor): array => [
                'id' => $floor->id,
                'nomor_lantai' => $floor->nomor_lantai,
                'nama' => $floor->nama,
            ], $building->lantais ?? []),
        ];
    }
}
